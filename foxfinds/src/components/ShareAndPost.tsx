"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/format";
import { Copy, Check, Download, ExternalLink, Loader2, Share2 } from "lucide-react";

export default function ShareAndPost({
  itemId, title, price, description,
}: { itemId: string; title: string; price: number | null; description: string | null }) {
  const supabase = createClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const shopUrl = typeof window !== "undefined" ? `${window.location.origin}/shop/${itemId}` : `/shop/${itemId}`;
  const listingText = [title, price != null ? money(price) : null, "", description ?? "", "", shopUrl]
    .filter((x) => x !== null).join("\n");

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
    } catch {
      setNote("Couldn't copy automatically — tap and hold the text to copy.");
    }
  }

  async function downloadPhotos() {
    setDownloading(true); setNote(null);
    try {
      const paths: string[] = [];
      const { data: it } = await supabase.from("items").select("image_path").eq("id", itemId).single();
      const cover = (it as { image_path: string | null } | null)?.image_path;
      if (cover) paths.push(cover);
      const { data: extras } = await supabase.from("item_photos").select("storage_path").eq("item_id", itemId).order("position");
      (extras ?? []).forEach((r) => { const p = (r as { storage_path: string }).storage_path; if (p && !paths.includes(p)) paths.push(p); });

      if (paths.length === 0) { setNote("No photos on this item yet."); setDownloading(false); return; }

      const { data: signed } = await supabase.storage.from("item-photos").createSignedUrls(paths, 3600);
      const base = (title || "item").replace(/[^\w.-]+/g, "_").slice(0, 40);
      let n = 0;
      for (const s of signed ?? []) {
        if (!s.signedUrl) continue;
        const res = await fetch(s.signedUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}-${++n}.jpg`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 400));
      }
      setNote(`Downloaded ${n} photo${n === 1 ? "" : "s"}. On a phone they save to Files (your originals are likely already in your camera roll).`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't download photos.");
    }
    setDownloading(false);
  }

  const btn = "flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:border-fox hover:bg-fox-tint disabled:opacity-60";

  return (
    <div className="rounded-xl2 border border-line bg-paper-raised p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Share2 size={16} className="text-fox-deep" />
        <h3 className="font-display text-base font-semibold">Share &amp; post</h3>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Copy the details and photos, then open Facebook Marketplace and paste. (Facebook has no way for apps to post for you — this makes it a 20-second paste instead.)
      </p>

      <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-ink-muted">Public link to this item</label>
      <div className="mt-1 flex items-center gap-2">
        <input readOnly value={shopUrl} onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none" />
        <button onClick={() => copy(shopUrl, "link")} className={btn} aria-label="Copy link">
          {copied === "link" ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button onClick={() => copy(listingText, "text")} className={btn}>
          {copied === "text" ? <Check size={15} /> : <Copy size={15} />} Copy listing text
        </button>
        <button onClick={downloadPhotos} disabled={downloading} className={btn}>
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download photos
        </button>
        <a href="https://www.facebook.com/marketplace/create/item" target="_blank" rel="noopener noreferrer"
          className={`${btn} border-fox bg-fox font-medium text-ink hover:bg-fox-deep`}>
          <ExternalLink size={15} /> Open Marketplace
        </a>
      </div>

      {note && <p className="mt-2 text-xs text-ink-muted">{note}</p>}
    </div>
  );
}