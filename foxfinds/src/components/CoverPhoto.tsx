"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageEditor from "@/components/ImageEditor";
import { toUploadable } from "@/lib/toUploadable";
import { Loader2, Upload, Pencil, Camera } from "lucide-react";

export default function CoverPhoto({ itemId, initialPath }: { itemId: string; initialPath: string | null }) {
  const supabase = createClient();
  const [path, setPath] = useState<string | null>(initialPath);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (path) {
        const { data } = await supabase.storage.from("item-photos").createSignedUrl(path, 3600);
        if (active) setUrl(data?.signedUrl ?? null);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [path, supabase]);

  async function writeCover(blob: Blob, ext: string, contentType: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); return; }
    const rand = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
    const newPath = `${user.id}/${itemId}-cover-${rand}.${ext}`;
    const { error: upErr } = await supabase.storage.from("item-photos").upload(newPath, blob, { contentType });
    if (upErr) { setError(upErr.message); return; }
    const { error: dbErr } = await supabase.from("items").update({ image_path: newPath }).eq("id", itemId);
    if (dbErr) { setError(dbErr.message); return; }
    setUrl(null);
    setPath(newPath);
    setNote("Cover updated.");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const { blob, ext, contentType } = await toUploadable(file);
      await writeCover(blob, ext, contentType);
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't process that photo."); }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  async function onEditSave(blob: Blob) {
    setBusy(true); setError(null); setNote(null);
    await writeCover(blob, "jpg", "image/jpeg");
    setEditing(false); setBusy(false);
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl2 border border-line bg-paper-sunk">
        {loading ? (
          <div className="grid h-full place-items-center text-ink-muted"><Loader2 className="animate-spin" size={18} /></div>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-ink-muted">No photo</div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        <button onClick={() => cameraRef.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60">
          <Camera size={13} /> Take photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {url ? "Replace cover" : "Upload cover"}
        </button>
        {url && (
          <button onClick={() => setEditing(true)} disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60">
            <Pencil size={13} /> Edit cover
          </button>
        )}
      </div>

      {note && <p className="mt-2 text-sm text-moss">{note}</p>}
      {error && <p className="mt-2 text-sm text-ember">{error}</p>}

      {editing && url && <ImageEditor src={url} onSave={onEditSave} onClose={() => setEditing(false)} />}
    </div>
  );
}
