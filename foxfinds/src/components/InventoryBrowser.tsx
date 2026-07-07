"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import type { Item } from "@/types";
import { Search, X } from "lucide-react";

export default function InventoryBrowser({ items, urls }: { items: Item[]; urls: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) set.add(i.category?.trim() || "Uncategorized");
    const sorted = Array.from(set).sort((a, b) =>
      a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b),
    );
    return ["All", ...sorted];
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      const catKey = i.category?.trim() || "Uncategorized";
      if (cat !== "All" && catKey !== cat) return false;
      if (!needle) return true;
      const hay = [i.title, i.category, i.brand, i.description, i.condition]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, cat]);

  const groups = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of filtered) {
      const key = i.category?.trim() || "Uncategorized";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(i);
    }
    return [...m.entries()].sort((a, b) =>
      a[0] === "Uncategorized" ? 1 : b[0] === "Uncategorized" ? -1 : a[0].localeCompare(b[0]),
    );
  }, [filtered]);

  return (
    <>
      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, brand, description…"
          className="w-full rounded-xl border border-line bg-paper-raised py-2.5 pl-9 pr-9 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="mb-6 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm ${
                cat === c ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-ink-soft hover:bg-paper-sunk"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
          Nothing here yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
          No matches{q ? <> for &ldquo;{q}&rdquo;</> : null}.
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(([category, group]) => (
            <section key={category}>
              <div className="rule mb-4 flex items-baseline gap-2">
                <h2 className="font-display text-lg font-semibold">{category}</h2>
                <span className="text-sm text-ink-muted">{group.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {group.map((i) => (
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
                      <div className="mt-2 font-display text-xl font-semibold">{money(i.suggested_price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}