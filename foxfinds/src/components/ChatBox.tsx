"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Send, Mail, KeyRound } from "lucide-react";

type Msg = { id: string; sender_role: "customer" | "seller"; body: string; created_at: string };

export default function ChatBox({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [emailInput, setEmailInput] = useState("");
  const [code, setCode] = useState("");
  const [authPhase, setAuthPhase] = useState<"idle" | "sending" | "code" | "verifying">("idle");
  const [authError, setAuthError] = useState<string | null>(null);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("id,sender_role,body,created_at")
        .eq("item_id", itemId)
        .eq("customer_id", userId)
        .order("created_at", { ascending: true });
      if (active) setMsgs((data ?? []) as Msg[]);
    }
    load();
    const t = setInterval(load, 4000);
    return () => { active = false; clearInterval(t); };
  }, [userId, itemId, supabase]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setAuthPhase("sending"); setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: emailInput, options: { shouldCreateUser: true } });
    if (error) { setAuthError(error.message); setAuthPhase("idle"); return; }
    setAuthPhase("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setAuthPhase("verifying"); setAuthError(null);
    const token = code.trim();
    let res = await supabase.auth.verifyOtp({ email: emailInput, token, type: "email" });
    if (res.error) res = await supabase.auth.verifyOtp({ email: emailInput, token, type: "signup" });
    if (res.error || !res.data.user) { setAuthError(res.error?.message ?? "That code didn't work."); setAuthPhase("code"); return; }
    setUserId(res.data.user.id);
    setUserEmail(res.data.user.email ?? emailInput);
    setAuthPhase("idle");
  }

  async function send() {
    const body = draft.trim();
    if (!body || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      item_id: itemId, customer_id: userId, customer_email: userEmail, sender_role: "customer", body,
    });
    setSending(false);
    if (!error) {
      setDraft("");
      const { data } = await supabase
        .from("messages").select("id,sender_role,body,created_at")
        .eq("item_id", itemId).eq("customer_id", userId).order("created_at", { ascending: true });
      setMsgs((data ?? []) as Msg[]);
    }
  }

  if (loading) return null;

  if (!userId) {
    if (authPhase === "code" || authPhase === "verifying") {
      return (
        <form onSubmit={verifyCode} className="space-y-3 rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
          <div className="flex items-center gap-2 text-sm font-medium"><KeyRound size={16} className="text-fox-deep" /> Enter your code</div>
          <p className="text-sm text-ink-muted">We emailed a 6-digit code to <span className="font-medium text-ink">{emailInput}</span>.</p>
          <input className={`${inp} tracking-[0.4em]`} inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
          {authError && <p className="text-sm text-ember">{authError}</p>}
          <button type="submit" disabled={authPhase === "verifying"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
            {authPhase === "verifying" ? <Loader2 size={16} className="animate-spin" /> : null} Verify & start chatting
          </button>
        </form>
      );
    }
    return (
      <form onSubmit={sendCode} className="space-y-3 rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
        <div className="text-sm font-medium">Message us about this piece</div>
        <p className="text-sm text-ink-muted">Enter your email — we&rsquo;ll send a 6-digit code so we can reply to you here.</p>
        <input className={inp} type="email" required placeholder="you@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
        {authError && <p className="text-sm text-ember">{authError}</p>}
        <button type="submit" disabled={authPhase === "sending"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
          {authPhase === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email me a code
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-xl2 border border-line bg-paper-raised shadow-card">
      <div className="border-b border-line px-4 py-3 text-sm font-medium">Chat about “{itemTitle}”</div>
      <div className="max-h-80 space-y-2 overflow-y-auto p-4">
        {msgs.length === 0 ? (
          <p className="text-sm text-ink-muted">No messages yet. Say hello and ask anything about this piece.</p>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className={`flex ${m.sender_role === "customer" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "customer" ? "bg-ink text-paper" : "bg-paper-sunk text-ink"}`}>
                {m.body}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-line p-3">
        <input
          className={inp}
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
        />
        <button onClick={send} disabled={sending || !draft.trim()} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-ink text-paper hover:bg-ink-soft disabled:opacity-50">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20";