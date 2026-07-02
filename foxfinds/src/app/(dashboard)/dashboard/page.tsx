import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, since } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import type { Item } from "@/types";
import { PlusCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items").select("*").order("created_at", { ascending: false });
  const items = (data ?? []) as Item[];

  const active = items.filter((i) => i.status !== "sold" && i.status !== "archived");
  const sold = items.filter((i) => i.status === "sold");
  const estValue = active.reduce((s, i) => s + (i.suggested_price ?? 0), 0);
  const profit = sold.reduce((s, i) => s + ((i.sold_price ?? 0) - (i.cost ?? 0)), 0);

  const stats = [
    { label: "In inventory", value: String(active.length) },
    { label: "Est. shelf value", value: money(estValue) },
    { label: "Items sold", value: String(sold.length) },
    { label: "Profit to date", value: money(profit), accent: true },
  ];

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The bench</p>
          <h1 className="font-display text-3xl font-semibold">Today&rsquo;s haul</h1>
        </div>
        <Link href="/add" className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft">
          <PlusCircle size={17} /> Add a find
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
            <div className="text-xs uppercase tracking-wide text-ink-muted">{s.label}</div>
            <div className={`mt-2 font-display text-3xl font-semibold ${s.accent ? "text-moss" : ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="rule font-display text-lg font-semibold">Recent finds</h2>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl2 border border-line bg-paper-raised shadow-card">
            {items.slice(0, 8).map((i) => (
              <Link
                key={i.id}
                href="/inventory"
                className="flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-0 hover:bg-paper-sunk"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{i.title}</div>
                  <div className="text-xs text-ink-muted">
                    {i.category ?? "Uncategorized"} · added {since(i.created_at)}
                  </div>
                </div>
                <div className="font-display text-lg">{money(i.suggested_price)}</div>
                <StatusBadge status={i.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center">
      <p className="font-display text-lg">No finds yet.</p>
      <p className="mt-1 text-sm text-ink-muted">Photograph your first piece and let the AI do the cataloguing.</p>
      <Link href="/add" className="mt-4 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft">
        Add your first find
      </Link>
    </div>
  );
}
