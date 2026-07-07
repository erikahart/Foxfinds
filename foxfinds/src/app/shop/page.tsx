import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/format";
import { getSellerLogoUrl } from "@/lib/brand";
import ShopBrowser from "@/components/ShopBrowser";

export const dynamic = "force-dynamic";

type ShopItem = {
  id: string;
  title: string;
  category: string | null;
  categories: string[] | null;
  brand: string | null;
  condition: string | null;
  description: string | null;
  suggested_price: number | null;
  image_path: string | null;
  created_at: string;
};

async function getListed(): Promise<{ items: ShopItem[]; urls: Record<string, string>; reserved: Set<string> }> {
  const urls: Record<string, string> = {};
  const reserved = new Set<string>();
  let items: ShopItem[] = [];

  let admin;
  try { admin = createAdminClient(); } catch { return { items, urls, reserved }; }

  // Items — the essential fetch. If this fails, there's nothing to show.
  try {
    const { data } = await admin
      .from("items")
      .select("id,title,category,categories,brand,condition,description,suggested_price,image_path,created_at,status")
      .eq("status", "listed")
      .order("created_at", { ascending: false });
    items = (data ?? []) as ShopItem[];
  } catch {
    return { items, urls, reserved };
  }

  // Photos — never let a signing hiccup blank the grid.
  try {
    const paths = items.map((i) => i.image_path).filter((p): p is string => !!p);
    if (paths.length) {
      const { data: signed } = await admin.storage.from("item-photos").createSignedUrls(paths, 3600);
      signed?.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
    }
  } catch { /* show items without photos rather than nothing */ }

  // Reservations — never let this blank the grid either.
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
  const logoUrl = await getSellerLogoUrl();

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-5 font-display text-xl font-semibold">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fox">✦</span>
          )}
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
          <ShopBrowser items={items} urls={urls} reservedIds={Array.from(reserved)} />
        )}
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-ink-muted">
        Reserve any piece for pickup — just tap it.
      </footer>
    </main>
  );
}
