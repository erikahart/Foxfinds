"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, X } from "lucide-react";

type Photo = { id: string; storage_path: string; url: string };

export default function ItemPhotos({ itemId }: { itemId: string }) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [itemId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("item_photos")
      .select("id,storage_path,position")
      .eq("item_id", itemId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    const rows = data ?? [];
    const paths = rows.map((r) => (r as { storage_path: string }).storage_path);
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("item-photos").createSignedUrls(paths, 3600);
      signed?.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
    }
    setPhotos(rows.map((r) => {
      const row = r as { id: string; storage_path: string };
      return { id: row.id, storage_path: row.storage_path, url: urls[row.storage_path] ?? "" };
    }));
    setLoading(false);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in again."); setUploading(false); return; }

    let pos = photos.length;
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const rand = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
      const path = `${user.id}/${itemId}-${rand}.${ext}`;
      const { error: upErr } = await supabase.storage.from("item-photos").upload(path, file, { contentType: file.type });
      if (upErr) { setError(upErr.message); continue; }
      const { error: dbErr } = await supabase.from("item_photos").insert({ item_id: itemId, storage_path: path, position: pos++ });
      if (dbErr) { setError(dbErr.message); }
    }
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setUploading(false);
  }

  async function remove(p: Photo) {
    setError(null);
    await supabase.storage.from("item-photos").remove([p.storage_path]);
    const { error: delErr } = await supabase.from("item_photos").delete().eq("id", p.id);
    if (delErr) { setError(delErr.message); return; }
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">More photos</span>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs hover:border-fox hover:bg-fox-tint disabled:opacity-60"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add photos
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-ember">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="animate-spin" size={15} /> Loading…</div>
      ) : photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-paper-raised p-3 text-center text-xs text-ink-muted">
          No extra photos yet. Add a few angles to help buyers.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-paper-sunk">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              ) : null}
              <button
                onClick={() => remove(p)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-paper opacity-0 transition-opacity hover:bg-ink group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}