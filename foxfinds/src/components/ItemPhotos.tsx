"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, X, ArrowLeft, ArrowRight, Star, Pencil, Camera } from "lucide-react";
import ImageEditor from "@/components/ImageEditor";
import { toUploadable } from "@/lib/toUploadable";

type Photo = { id: string; storage_path: string; position: number; url: string };

export default function ItemPhotos({ itemId }: { itemId: string }) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [editing, setEditing] = useState<Photo | null>(null);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [itemId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("item_photos")
      .select("id,storage_path,position")
      .eq("item_id", itemId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as { id: string; storage_path: string; position: number }[];
    const paths = rows.map((r) => r.storage_path);
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("item-photos").createSignedUrls(paths, 3600);
      signed?.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
    }
    setPhotos(rows.map((r) => ({ id: r.id, storage_path: r.storage_path, position: r.position, url: urls[r.storage_path] ?? "" })));
    setLoading(false);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setError(null); setNote(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setUploading(false); return; }

    let pos = photos.length;
    for (const file of files) {
      try {
        const { blob, ext, contentType } = await toUploadable(file);
        const rand = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
        const path = `${user.id}/${itemId}-${rand}.${ext}`;
        const { error: upErr } = await supabase.storage.from("item-photos").upload(path, blob, { contentType });
        if (upErr) { setError(upErr.message); continue; }
        const { error: dbErr } = await supabase.from("item_photos").insert({ item_id: itemId, storage_path: path, position: pos++ });
        if (dbErr) { setError(dbErr.message); }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't process that photo.");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setUploading(false);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    setBusy(true); setError(null); setNote(null);
    const a = photos[index], b = photos[target];
    // Swap their positions in the database
    await supabase.from("item_photos").update({ position: b.position }).eq("id", a.id);
    await supabase.from("item_photos").update({ position: a.position }).eq("id", b.id);
    await load();
    setBusy(false);
  }

  async function setCover(p: Photo) {
    setBusy(true); setError(null); setNote(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please sign in again."); setBusy(false); return; }
      // Copy the file so the cover is independent — editing/deleting this photo won't affect the cover.
      const res = await fetch(p.url);
      const blob = await res.blob();
      const rand = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
      const newPath = `${user.id}/${itemId}-cover-${rand}.jpg`;
      const { error: upErr } = await supabase.storage.from("item-photos").upload(newPath, blob, { contentType: blob.type || "image/jpeg" });
      if (upErr) { setError(upErr.message); setBusy(false); return; }
      const { error: err } = await supabase.from("items").update({ image_path: newPath }).eq("id", itemId);
      if (err) { setError(err.message); setBusy(false); return; }
      setNote("Cover updated — reload to see it in grids and the shop.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't set cover.");
    }
    setBusy(false);
  }

  async function applyEdit(blob: Blob) {
    if (!editing) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); return; }
    const rand = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
    const newPath = `${user.id}/${itemId}-${rand}.jpg`;
    const { error: upErr } = await supabase.storage.from("item-photos").upload(newPath, blob, { contentType: "image/jpeg" });
    if (upErr) { setError(upErr.message); return; }
    const oldPath = editing.storage_path;
    const { error: dbErr } = await supabase.from("item_photos").update({ storage_path: newPath }).eq("id", editing.id);
    if (dbErr) { setError(dbErr.message); return; }
    await supabase.storage.from("item-photos").remove([oldPath]);
    setEditing(null);
    setNote("Photo updated.");
    await load();
  }

  async function remove(p: Photo) {
    setError(null); setNote(null);
    await supabase.storage.from("item-photos").remove([p.storage_path]);
    const { error: delErr } = await supabase.from("item_photos").delete().eq("id", p.id);
    if (delErr) { setError(delErr.message); return; }
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">More photos</span>
        <div className="flex items-center gap-2">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFiles} />
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={uploading || busy}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60"
          >
            <Camera size={13} /> Take photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || busy}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add photos
          </button>
        </div>
      </div>

      {error && <p className="mb-2 text-sm text-ember">{error}</p>}
      {note && <p className="mb-2 text-sm text-moss">{note}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="animate-spin" size={15} /> Loading…</div>
      ) : photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-paper-raised p-3 text-center text-xs text-ink-muted">
          No extra photos yet. Add a few angles to help buyers.
        </p>
      ) : (
        <div className="space-y-2">
          {photos.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-paper-raised p-2">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-paper-sunk">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                <button onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="Move left"
                  className="grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-paper-sunk disabled:opacity-40">
                  <ArrowLeft size={15} />
                </button>
                <button onClick={() => move(i, 1)} disabled={busy || i === photos.length - 1} aria-label="Move right"
                  className="grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-paper-sunk disabled:opacity-40">
                  <ArrowRight size={15} />
                </button>
                <button onClick={() => setEditing(p)} disabled={busy}
                  className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => setCover(p)} disabled={busy}
                  className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60">
                  <Star size={13} /> Set as cover
                </button>
              </div>

              <button onClick={() => remove(p)} disabled={busy} aria-label="Remove photo"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-ink-muted hover:bg-ember-tint hover:text-ember disabled:opacity-60">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && editing.url && (
        <ImageEditor src={editing.url} onSave={applyEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
