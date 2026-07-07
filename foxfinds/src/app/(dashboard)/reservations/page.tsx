"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { money, since } from "@/lib/format";
import { Loader2, Check, X, Mail } from "lucide-react";

type Row = {
  id: string;
  item_id: string;
  customer_email: string | null;
  customer_name: string | null;
  pickup_note: string | null;
  status: "pending" | "confirmed" | "declined" | "completed";
  created_at: string;
  items: { title: string; suggested_price: number | null; status: string } | null;
};

export default function ReservationsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("reservations")
      .select("id,item_id,customer_email,customer_name,pickup_note,status,created_at,items(title,suggested_price,status)")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }

  async function setStatus(id: string, status: Row["status"]) {
    setBusy(id);
    await supabase.from("reservations").update({ status }).eq("id", id);
    await load();
    setBusy(null);
  }

  const badge: Record<string, string> = {
    pending: "bg-fox-tint text-fox-deep",
    confirmed: "bg-moss-tint text-moss",
    declined: "bg-paper-sunk text-ink-muted",
    completed: "bg-paper-sunk text-ink-muted",
  };

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The counter</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Reservations</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-muted"><Loader2 className="animate-spin" size={18} /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
          No reservations yet. When a customer reserves a listed item from your shop, it&rsquo;ll show up here.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl2 border border-line bg-paper-raised p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{r.items?.title ?? "Item"}</div>
                  <div className="text-sm text-ink-muted">
                    {money(r.items?.suggested_price)} · requested {since(r.created_at)}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badge[r.status]}`}>{r.status}</span>
              </div>

              <div className="mt-3 rounded-lg bg-paper-sunk p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-ink-muted" />
                  <span className="font-medium">{r.customer_name || "Customer"}</span>
                  <a href={`mailto:${r.customer_email}`} className="text-fox-deep underline underline-offset-2">{r.customer_email}</a>
                </div>
                {r.pickup_note && <p className="mt-1 text-ink-soft">“{r.pickup_note}”</p>}
              </div>

              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setStatus(r.id, "confirmed")} disabled={busy === r.id}
                    className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
                    <Check size={15} /> Confirm
                  </button>
                  <button onClick={() => setStatus(r.id, "declined")} disabled={busy === r.id}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted hover:bg-paper-sunk disabled:opacity-60">
                    <X size={15} /> Decline
                  </button>
                </div>
              )}
              {r.status === "confirmed" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setStatus(r.id, "completed")} disabled={busy === r.id}
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink-muted hover:bg-paper-sunk disabled:opacity-60">
                    Mark picked up
                  </button>
                  <button onClick={() => setStatus(r.id, "declined")} disabled={busy === r.id}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted hover:bg-paper-sunk disabled:opacity-60">
                    <X size={15} /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
