"use client";
import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";
import { SHOP_FILTERS } from "@/lib/categories";

type ShopItem = {
  id: string;
  title: string;
  category: string | null;
  condition: string | null;
  description: string | null;
  suggested_price: number | null;
  image_path: string | null;
  created_at: string;
  categories: string[] | null;
};

function matches(i: ShopItem, f: string): boolean {
  if (f === "All") return true;
  if (f === "New Arrivals") {
    const days = (Date.now() - new Date(i.created_at).getTime()) / 86_400_000;
    return days <= 14;
  }
  if (f === "Under $25") return (i.suggested_price ?? Number.POSITIVE_INFINITY) <= 25;
  const nf = f.toLowerCase();
  const cats = [i.category, ...(i.categories ?? [])]
    .filter((c): c is string => !!c).map((c) => c.toLowerCase());
  return cats.some((c) => c === nf || c.includes(nf));
}

export default function ShopBrowser({
  items, urls, reservedIds,
}: { items: ShopItem[]; urls: Record<string, string>; reservedIds: string[] }) {
  const [filter, setFilter] = useState("All");
  const reserved = new Set(reservedIds);
  const shown = items.filter((i) => matches(i, filter));

  return (
    <>
      {/* Filter buttons — horizontally scrollable on small screens */}
      <div className="mt-6 -mx-6 overflow-x-auto px-6">
        <div className="flex gap-2 pb-1">
          {SHOP_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                filter === f ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-ink-soft hover:border-line-strong"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-12 text-center text-ink-muted">
          Nothing in &ldquo;{filter}&rdquo; right now.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {shown.map((i) => (
            <Link key={i.id} href={`/shop/${i.id}`} className="group block overflow-hidden rounded-xl2 border border-line bg-paper-raised shadow-card transition-colors hover:border-line-strong">
              <div className="relative aspect-[4/5] bg-paper-sunk">
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
    </>
  );
}
