"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, Check } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("logo_path").eq("id", user.id).single();
    if (data?.logo_path) {
      const { data: s } = await supabase.storage.from("item-photos").createSignedUrl(data.logo_path, 3600);
      setLogoUrl(s?.signedUrl ?? null);
    }
    setLoading(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null); setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setUploading(false); return; }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("item-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setError(upErr.message); setUploading(false); return; }

    const { error: dbErr } = await supabase.from("profiles").update({ logo_path: path }).eq("id", user.id);
    if (dbErr) { setError(dbErr.message); setUploading(false); return; }

    const { data: s } = await supabase.storage.from("item-photos").createSignedUrl(path, 3600);
    setLogoUrl(s?.signedUrl ?? null);
    setUploading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The counter</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Settings</h1>

      <div className="max-w-lg rounded-xl2 border border-line bg-paper-raised p-6 shadow-card">
        <h2 className="font-medium">Shop logo</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Shown in your dashboard and at the top of your public shop. A square, icon-style image works best (PNG with a transparent background is ideal).
        </p>

        <div className="mt-5 flex items-center gap-4">
          <div className="grid h-20 w-20 flex-shrink-0 place-items-center overflow-hidden rounded-xl2 border border-line bg-paper-sunk">
            {loading ? (
              <Loader2 className="animate-spin text-ink-muted" size={18} />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Your logo" className="h-full w-full object-contain" />
            ) : (
              <span className="font-display text-2xl text-ink-muted">✦</span>
            )}
          </div>

          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={onFile} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            {saved && <p className="mt-2 flex items-center gap-1.5 text-sm text-moss"><Check size={15} /> Saved — reload to see it everywhere.</p>}
            {error && <p className="mt-2 text-sm text-ember">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}