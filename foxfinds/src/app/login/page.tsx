"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { business_name: business || "My shop" } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 font-display text-2xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-fox">✦</span>
          Fox Finds
        </div>

        <h1 className="font-display text-2xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Set up your shop"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === "signin" ? "Sign in to your inventory." : "Start cataloguing your finds."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <Field label="Shop name" value={business} onChange={setBusiness} placeholder="Fox Finds Resale" />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

          {error && (
            <p className="rounded-lg bg-ember-tint px-3 py-2 text-sm text-ember">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
          >
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="mt-4 text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20"
      />
    </label>
  );
}
