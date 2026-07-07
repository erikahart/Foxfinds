import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedPhotoUrls } from "@/lib/supabase/photos";
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

  const revenue = sold.reduce((s, i) => s + (i.sold_price ?? 0), 0);
  const cogs = sold.reduce((s, i) => s + (i.cost ?? 0), 0);
  const profit = revenue - cogs;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : null;

  const recent = items.slice(0, 8);
  const urls = await signedPhotoUrls(supabase as never, recent.map((i) => i.image_path));

  const stats = [
    { label: "In inventory", value: String(active.length) },
    { label: "Est. shelf value", value: money(estValue) },
    { label: "Items sold", value: String(sold.length) },
    { label: "Profit to date", value: money(profit), tone: profit < 0 ? "text-ember" : "text-moss" },
  ];

  return (
    <>
      <div className="mb-6 flex items-end justify-between md:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The bench</p>
          <h1 className="font-display text-3xl font-semibold">Today&rsquo;s haul</h1>
        </div>
        <Link href="/add" className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-fox px-4 py-2.5 text-sm font-semibold text-ink shadow-card hover:bg-fox-deep">
          <PlusCircle size={17} /> Add a find
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl2 border border-line bg-paper-raised p-4 shadow-card md:p-5">
            <div className="text-xs uppercase tracking-wide text-ink-muted">{s.label}</div>
            <div className={`mt-1 font-display text-2xl font-semibold md:mt-2 md:text-3xl ${s.tone ?? ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* The books — all-time P&L */}
      <div className="mt-6 md:mt-8">
        <h2 className="rule font-display text-lg font-semibold">The books</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="rounded-xl2 border border-line bg-paper-raised p-4 shadow-card md:p-6">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Revenue (all-time)</dt>
                <dd className="font-display text-lg">{money(revenue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Cost of goods sold</dt>
                <dd className="font-display text-lg text-ink-muted">{revenue || cogs ? `-${money(cogs)}` : money(0)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-medium">Net profit</dt>
                <dd className={`font-display text-2xl font-semibold ${profit < 0 ? "text-ember" : "text-moss"}`}>{money(profit)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col justify-center rounded-xl2 border border-line bg-ink p-4 text-paper shadow-card md:p-6">
            <div className="text-xs uppercase tracking-wide text-paper/60">Return on cost</div>
            <div className="mt-1 font-display text-3xl font-semibold md:text-4xl">
              {margin == null ? "—" : `${margin}%`}
            </div>
            <div className="mt-1 text-xs text-paper/60">
              {sold.length === 0 ? "No sales yet" : `across ${sold.length} sold`}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-10">
        <h2 className="rule font-display text-lg font-semibold">Recent finds</h2>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl2 border border-line bg-paper-raised shadow-card">
            {recent.map((i) => (
              <Link
                key={i.id}
                href={`/inventory/${i.id}`}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0 hover:bg-paper-sunk"
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-paper-sunk">
                  {i.image_path && urls[i.image_path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[i.image_path]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-[10px] text-ink-muted">No photo</div>
                  )}
                </div>
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
