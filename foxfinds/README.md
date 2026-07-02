# Fox Finds

AI-powered reselling platform for storage-unit finds. Photograph an item, let Claude
identify and price it, then generate marketplace-ready listing drafts for eBay, Etsy,
Poshmark, Mercari, and Facebook Marketplace.

This is the **production** codebase — real auth, real database, real AI — that replaces
the earlier front-end demo.

## Stack

| Layer     | Choice                                    |
|-----------|-------------------------------------------|
| Framework | Next.js 14 (App Router) + TypeScript      |
| Styling   | Tailwind CSS (Fraunces + Inter)           |
| Auth/DB   | Supabase (Postgres + Auth + Storage)      |
| AI        | Anthropic Claude (vision) via server route|
| Hosting   | Netlify                                    |

## What's included

- Email/password auth with per-user data isolation (Postgres row-level security)
- Photo upload to private Supabase Storage
- **AI item analysis** — title, category, brand, condition, description, keywords, price range
- Inventory with status filters (draft / listed / sold) and profit tracking
- **Listing generator** — per-marketplace drafts with fee-aware take-home estimates and copy-to-clipboard
- Dashboard with shelf value and profit-to-date

## What's intentionally *not* here (fast-follow)

Live API posting to eBay/Etsy is out of scope for v1. Those require developer accounts,
per-marketplace OAuth, and app-review that can take weeks. The app generates polished
drafts you copy/paste today; wiring live posting later means adding OAuth + each
marketplace's listing API behind the same `/api/generate-listing` pattern.

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
   This creates the `profiles`, `items`, and `listings` tables, row-level-security policies,
   the signup trigger, and the private `item-photos` storage bucket.
3. From **Project Settings → API**, copy the **Project URL** and the **anon public** key.

### 2. Anthropic

Create an API key at [console.anthropic.com](https://console.anthropic.com). Keep it
server-side only — it is never exposed to the browser.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and add your first find.

---

## Deploy to Netlify

1. Push this repo to GitHub and **Import** it in Netlify (or `netlify deploy`).
2. The `@netlify/plugin-nextjs` plugin (declared in `netlify.toml`) is picked up automatically.
3. In **Site settings → Environment variables**, add the same three variables as above.
4. In **Supabase → Authentication → URL Configuration**, add your Netlify URL to the
   redirect allow-list so email confirmation returns to `/auth/callback`.

---

## Architecture notes

- **AI runs server-side only.** `/api/analyze` and `/api/generate-listing` are the only
  code paths that touch `ANTHROPIC_API_KEY`. The browser sends an image (base64) or an item
  id; the key never leaves the server.
- **Data isolation is enforced in the database**, not just the UI. Every `items`/`listings`
  row carries a `user_id`, and RLS policies restrict every read/write to `auth.uid()`.
- **Photos are private.** Uploads go to a non-public bucket; the app mints short-lived
  signed URLs (1 hour) to display them.
- **Auth session refresh** happens in `src/middleware.ts` on every request.

## Project layout

```
src/
  app/
    page.tsx                 landing
    login/                   auth (sign in / sign up)
    auth/callback/           email-confirmation exchange
    (dashboard)/             authenticated app shell
      dashboard/  inventory/  add/  listings/
    api/
      analyze/               photo -> structured item analysis
      generate-listing/      item -> marketplace draft
  components/                sidebar, badges, listings workbench
  lib/
    supabase/                browser + server + middleware clients, signed photos
    anthropic.ts             lazy server client + JSON extraction
    marketplaces.ts          per-marketplace specs + fee math
    format.ts                money / relative-time helpers
  types/                     shared types
supabase/schema.sql          database + RLS + storage (run once)
```

## Cost & safety

- Each photo analysis is one Claude vision call; each listing draft is one text call.
  Budget accordingly and consider rate-limiting per user before opening signups.
- Never commit `.env.local`. Rotate the Anthropic key if it is ever exposed.
