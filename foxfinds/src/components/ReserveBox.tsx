"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Mail, KeyRound } from "lucide-react";

export default function ReserveBox({
  itemId, itemTitle, alreadyReserved,
}: { itemId: string; itemTitle: string; alreadyReserved: boolean }) {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "code" | "verifying" | "reserving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, [supabase]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setPhase("sending"); setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: { shouldCreateUser: true },
    });
    if (error) { setError(error.message); setPhase("idle"); return; }
    setPhase("code");
  }

async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setPhase("verifying"); setError(null);
    const token = code.trim();
    // New reservers verify as "signup"; returning ones as "email". Try both.
    let res = await supabase.auth.verifyOtp({ email: emailInput, token, type: "email" });
    if (res.error) {
      res = await supabase.auth.verifyOtp({ email: emailInput, token, type: "signup" });
    }
    if (res.error || !res.data.user) { setError(res.error?.message ?? "That code didn't work. Try again."); setPhase("code"); return; }
    setEmail(res.data.user.email ?? emailInput);
    setPhase("idle");
  }

  if (alreadyReserved) {
    return (
      <div className="rounded-xl2 border border-line bg-fox-tint p-4 text-sm text-fox-deep">
        This piece is currently <strong>reserved</strong>. Check back — it may become available again.
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="animate-spin" size={16} /> Loading…</div>;
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl2 border border-moss/40 bg-moss-tint p-4 text-sm text-moss">
        <div className="flex items-center gap-2 font-medium"><Check size={16} /> Reserved!</div>
        <p className="mt-1">We&rsquo;ve got your request for “{itemTitle}.” We&rsquo;ll be in touch about pickup.</p>
      </div>
    );
  }

  if (email) {
    return (
      <div className="space-y-3 rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
        <div className="text-sm text-ink-muted">Reserving as <span className="font-medium text-ink">{email}</span></div>
        <input className={inp} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className={`${inp} min-h-[72px] resize-y`} placeholder="Pickup notes (optional) — e.g. best times to grab it" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button onClick={reserve} disabled={phase === "reserving"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
          {phase === "reserving" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Reserve for pickup
        </button>
      </div>
    );
  }

  if (phase === "code" || phase === "verifying") {
    return (
      <form onSubmit={verifyCode} className="space-y-3 rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm font-medium"><KeyRound size={16} className="text-fox-deep" /> Enter your code</div>
        <p className="text-sm text-ink-muted">We emailed a 6-digit code to <span className="font-medium text-ink">{emailInput}</span>. Enter it below.</p>
        <input className={`${inp} tracking-[0.4em]`} inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button type="submit" disabled={phase === "verifying"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
          {phase === "verifying" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Verify & continue
        </button>
        <button type="button" onClick={() => { setPhase("idle"); setCode(""); setError(null); }} className="text-xs text-ink-muted hover:text-ink">
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-3 rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
      <div className="text-sm font-medium">Reserve this for pickup</div>
      <p className="text-sm text-ink-muted">Enter your email — we&rsquo;ll send a 6-digit code, no password needed.</p>
      <input className={inp} type="email" required placeholder="you@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
      {error && <p className="text-sm text-ember">{error}</p>}
      <button type="submit" disabled={phase === "sending"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
        {phase === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Email me a code
      </button>
    </form>
  );
}

const inp =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20";