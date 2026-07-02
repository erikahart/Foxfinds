import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Camera, Sparkles, Tags } from "lucide-react";

export default async function Landing() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fox">✦</span>
          Fox&nbsp;Finds
        </div>
        <Link href="/login" className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-paper-sunk">
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10 md:pt-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-fox-deep">
          For storage-unit flippers
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
          Every find, catalogued, priced, and listed before the dust settles.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-muted">
          Photograph a piece. Fox Finds identifies it, estimates resale value, and
          writes marketplace-ready listings — so you spend time sourcing, not typing.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login" className="rounded-xl bg-ink px-6 py-3 font-medium text-paper hover:bg-ink-soft">
            Start cataloguing
          </Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: Camera, t: "Snap", d: "Upload a photo of any find." },
            { icon: Sparkles, t: "Identify", d: "AI names it, dates it, prices it." },
            { icon: Tags, t: "List", d: "Draft listings for five marketplaces." },
          ].map(({ icon: Icon, t, d }, i) => (
            <div key={t} className="rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2 text-fox-deep">
                <Icon size={18} />
                <span className="font-display text-sm text-ink-muted">0{i + 1}</span>
              </div>
              <div className="font-display text-lg font-semibold">{t}</div>
              <p className="mt-1 text-sm text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
