"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Send } from "lucide-react";

type Msg = {
  id: string;
  item_id: string;
  customer_id: string;
  customer_email: string | null;
  sender_role: "customer" | "seller";
  body: string;
  created_at: string;
  items: { title: string } | null;
};

type Thread = {
  key: string;
  itemId: string;
  customerId: string;
  itemTitle: string;
  customerEmail: string;
  msgs: Msg[];
  last: string;
};

export default function MessagesPage() {
  const supabase = createClient();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const { data } = await supabase
      .from("messages")
      .select("id,item_id,customer_id,customer_email,sender_role,body,created_at,items(title)")
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as unknown as Msg[];

    const map = new Map<string, Thread>();
    for (const m of rows) {
      const key = `${m.item_id}:${m.customer_id}`;
      if (!map.has(key)) {
        map.set(key, {
          key, itemId: m.item_id, customerId: m.customer_id,
          itemTitle: m.items?.title ?? "Item",
          customerEmail: m.customer_email ?? "Customer",
          msgs: [], last: m.created_at,
        });
      }
      const t = map.get(key)!;
      t.msgs.push(m);
      t.last = m.created_at;
      if (m.customer_email) t.customerEmail = m.customer_email;
    }
    const list = [...map.values()].sort((a, b) => (a.last < b.last ? 1 : -1));
    setThreads(list);
    setActiveKey((prev) => prev ?? list[0]?.key ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const active = threads.find((t) => t.key === activeKey) ?? null;
  useEffect(() => { bottomRef.current?.scrollIntoView(); }, [active?.msgs.length]);

  async function reply() {
    const body = draft.trim();
    if (!body || !active) return;
    setSending(true);
    await supabase.from("messages").insert({
      item_id: active.itemId,
      customer_id: active.customerId,
      customer_email: active.customerEmail,
      sender_role: "seller",
      body,
    });
    setDraft("");
    await load();
    setSending(false);
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The counter</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Messages</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-muted"><Loader2 className="animate-spin" size={18} /> Loading…</div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
          No messages yet. When a customer messages you about a piece, the conversation shows up here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
          <div className="space-y-1.5">
            {threads.map((t) => (
              <button key={t.key} onClick={() => setActiveKey(t.key)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left ${activeKey === t.key ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised hover:bg-paper-sunk"}`}>
                <div className="line-clamp-1 text-sm font-medium">{t.itemTitle}</div>
                <div className={`line-clamp-1 text-xs ${activeKey === t.key ? "text-paper/70" : "text-ink-muted"}`}>{t.customerEmail}</div>
              </button>
            ))}
          </div>

          {active && (
            <div className="flex flex-col rounded-xl2 border border-line bg-paper-raised shadow-card">
              <div className="border-b border-line px-4 py-3">
                <div className="text-sm font-medium">{active.itemTitle}</div>
                <a href={`mailto:${active.customerEmail}`} className="text-xs text-fox-deep underline underline-offset-2">{active.customerEmail}</a>
              </div>
              <div className="max-h-96 flex-1 space-y-2 overflow-y-auto p-4">
                {active.msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "seller" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "seller" ? "bg-ink text-paper" : "bg-paper-sunk text-ink"}`}>
                      {m.body}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-line p-3">
                <input className={inp} placeholder="Reply…" value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); reply(); } }} />
                <button onClick={reply} disabled={sending || !draft.trim()} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-ink text-paper hover:bg-ink-soft disabled:opacity-50">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const inp =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20";