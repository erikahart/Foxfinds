import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

type ShopItem = {
  id: string;
  title: string;
  category: string | null;
  brand: string | null;
  condition: string | null;
  description: string | null;
  suggested_price: number | null;
  image_path: string | null;
};

async function getListed(): Promise<{ items: ShopItem[]; urls: Record<string, string>; reserved: Set<string> }> {
  const urls: Record<string, string> = {};
  const reserved = new Set<string>();
  let items: ShopItem[] = [];

  let admin;
  try { admin = createAdminClient(); } catch { return { items, urls, reserved }; }

  try {
    const { data } = await admin
      .from("items")
      .select("id,title,category,brand,condition,description,suggested_price,image_path,created_at,status")
      .eq("status", "listed")
      .order("created_at", { ascending: false });
    items = (data ?? []) as ShopItem[];
  } catch {
    return { items, urls, reserved };
  }

  try {
    const paths = items.map((i) => i.image_path).filter((p): p is string => !!p);
    if (paths.length) {
      const { data: signed } = await admin.storage.from("item-photos").createSignedUrls(paths, 3600);
      signed?.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
    }
  } catch { /* show items without photos rather than nothing */ }

  try {
    if (items.length) {
      const { data: res } = await admin
        .from("reservations")
        .select("item_id,status")
        .in("item_id", items.map((i) => i.id))
        .in("status", ["pending", "confirmed"]);
      res?.forEach((r) => reserved.add((r as { item_id: string }).item_id));
    }
  } catch { /* no reservation badges, but items still show */ }

  return { items, urls, reserved };
}

export default async function ShopPage() {
  const { items, urls, reserved } = await getListed();

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-5 font-display text-xl font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fox">✦</span>
          Fox Finds
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fox-deep">Available now</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">The shop</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          One-of-a-kind finds, ready for pickup. Browse what&rsquo;s available today.
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-12 text-center text-ink-muted">
            Nothing available right now — check back soon.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {items.map((i) => (
              <Link key={i.id} href={`/shop/${i.id}`} className="group block overflow-hidden rounded-xl2 border border-line bg-paper-raised shadow-card transition-colors hover:border-line-strong">
                <div className="relative aspect-square bg-paper-sunk">
                  {i.image_path && urls[i.image_path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[i.image_path]} alt={i.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-ink-muted">No photo</div>
                  )}
                  {reserved.has(i.id) && (
                    <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-paper">Reserved</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-medium leading-snug">{i.title}</h2>
                    <div className="font-display text-xl font-semibold">{money(i.suggested_price)}</div>
                  </div>
                  {i.condition && <div className="mt-1 text-xs uppercase tracking-wide text-fox-deep">{i.condition}</div>}
                  {i.description && <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{i.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-ink-muted">
        Reserve any piece for pickup — just tap it.
      </footer>
    </main>
  );
}