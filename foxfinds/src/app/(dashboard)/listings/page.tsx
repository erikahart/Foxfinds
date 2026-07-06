import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ListingsWorkbench from "@/components/ListingsWorkbench";
import type { Item, Listing } from "@/types";

export default async function ListingsPage() {
  const supabase = await createClient();
  const [{ data: itemsData }, { data: listingsData }] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: false }),
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
  ]);

  const items = (itemsData ?? []) as Item[];

  const photoUrls: Record<string, string> = {};
  const paths = items.map((i) => i.image_path).filter((p): p is string => !!p);
  if (paths.length) {
    try {
      const admin = createAdminClient();
      const { data: signed } = await admin.storage.from("item-photos").createSignedUrls(paths, 3600);
      signed?.forEach((s) => { if (s.path && s.signedUrl) photoUrls[s.path] = s.signedUrl; });
    } catch { /* thumbnails are optional; workbench still works without them */ }
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The counter</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Listings</h1>
      <ListingsWorkbench
        items={items}
        initialListings={(listingsData ?? []) as Listing[]}
        photoUrls={photoUrls}
      />
    </>
  );
}