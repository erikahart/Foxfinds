-- Fox Finds — database schema, RLS, and storage
-- Run in Supabase → SQL Editor (or via `supabase db push`).

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, business_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'business_name', 'My shop'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- items ----------
create type item_status as enum ('draft', 'listed', 'sold', 'archived');

create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  category       text,
  brand          text,
  condition      text,
  description    text,
  keywords       text[] default '{}',
  price_low      numeric(10,2),
  price_high     numeric(10,2),
  suggested_price numeric(10,2),
  cost           numeric(10,2) default 0,
  sold_price     numeric(10,2),
  image_path     text,             -- path in the item-photos bucket
  status         item_status not null default 'draft',
  source_unit    text,             -- e.g. "Unit 104"
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists items_user_idx on public.items(user_id);
create index if not exists items_status_idx on public.items(user_id, status);

-- ---------- listings (per-marketplace drafts) ----------
create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  marketplace  text not null,      -- ebay | etsy | poshmark | mercari | facebook
  title        text,
  description  text,
  price        numeric(10,2),
  tags         text[] default '{}',
  status       text not null default 'draft', -- draft | posted | sold
  external_url text,
  created_at   timestamptz not null default now()
);
create index if not exists listings_item_idx on public.listings(item_id);

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.items    enable row level security;
alter table public.listings enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own items" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own listings" on public.listings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Storage: item photos ----------
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;

create policy "read own photos" on storage.objects
  for select using (bucket_id = 'item-photos' and owner = auth.uid());
create policy "upload own photos" on storage.objects
  for insert with check (bucket_id = 'item-photos' and owner = auth.uid());
create policy "delete own photos" on storage.objects
  for delete using (bucket_id = 'item-photos' and owner = auth.uid());
