import { createClient } from "@/lib/supabase/server";
import ListingsWorkbench from "@/components/ListingsWorkbench";
import type { Item, Listing } from "@/types";

export default async function ListingsPage() {
  const supabase = await createClient();
  const [{ data: itemsData }, { data: listingsData }] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: false }),
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The counter</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Listings</h1>
      <ListingsWorkbench
        items={(itemsData ?? []) as Item[]}
        initialListings={(listingsData ?? []) as Listing[]}
      />
    </>
  );
}
