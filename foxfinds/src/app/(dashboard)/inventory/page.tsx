import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedPhotoUrls } from "@/lib/supabase/photos";
import { money } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import type { Item, ItemStatus } from "@/types";
import { PlusCircle } from "lucide-react";

const FILTERS: { key: ItemStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "listed", label: "Listed" },
  { key: "sold", label: "Sold" },
];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("items").select("*").order("created_at", { ascending: false });
  const all = (data ?? []) as Item[];
  const items = status && status !== "all" ? all.filter((i) => i.status === status) : all;
  const urls = await signedPhotoUrls(supabase as never, items.map((i) => i.image_path));

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The shelf</p>
          <h1 className="font-display text-3xl font-semibold">Inventory</h1>
        </div>
        <Link href="/add" className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft">
          <PlusCircle size={17} /> Add a find
        </Link>
      </div>

      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => {
          const active = (status ?? "all") === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/inventory" : `/inventory?status=${f.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
                active ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-ink-soft hover:bg-paper-sunk"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
          Nothing here yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((i) => (
            <Link key={i.id} href={`/inventory/${i.id}`} className="block overflow-hidden rounded-xl2 border border-line bg-paper-raised shadow-card transition-colors hover:border-line-strong">
              <div className="aspect-square bg-paper-sunk">
                {i.image_path && urls[i.image_path] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[i.image_path]} alt={i.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-ink-muted">No photo</div>
                )}
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="line-clamp-2 text-sm font-medium">{i.title}</div>
                  <StatusBadge status={i.status} />
                </div>
                <div className="mt-1 text-xs text-ink-muted">{i.category ?? "Uncategorized"}</div>
                <div className="mt-2 font-display text-xl font-semibold">{money(i.suggested_price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
