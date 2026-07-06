"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Analysis } from "@/types";
import { Upload, Check, X, Loader2, ArrowLeft } from "lucide-react";

const inp =
  "w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20";

const MAX = 20;

type Row = {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "ready" | "error";
  analysis: Analysis | null;
  cost: string;
  error?: string;
};

type NewItem = {
  user_id: string; title: string; category: string | null; brand: string | null;
  condition: string; description: string; keywords: string[];
  price_low: number; price_high: number; suggested_price: number;
  cost: number; image_path: string; status: "draft";
};

export default function BulkAddPage() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [phase, setPhase] = useState<"select" | "analyzing" | "review" | "saving">("select");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList) {
    const list = Array.from(files).slice(0, MAX);
    const newRows: Row[] = list.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      analysis: null,
      cost: "",
    }));
    setRows(newRows);
    setPhase("analyzing");
    setProgress({ done: 0, total: newRows.length });
    for (const row of newRows) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "analyzing" } : r)));
      try {
        const { base64, mediaType } = await toBase64(row.file);
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, media_type: mediaType }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Analysis failed");
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "ready", analysis: json.analysis } : r)));
      } catch (err) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "error", error: err instanceof Error ? err.message : "Failed" } : r)));
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setPhase("review");
  }

  function patch(id: string, p: Partial<Analysis>) {
    setRows((prev) => prev.map((r) => (r.id === id && r.analysis ? { ...r, analysis: { ...r.analysis, ...p } } : r)));
  }
  function setCost(id: string, cost: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, cost } : r)));
  }
  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function saveAll() {
    const ready = rows.filter((r) => r.status === "ready" && r.analysis);
    if (ready.length === 0) return;
    setPhase("saving"); setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You're not signed in.");

      const toInsert: NewItem[] = [];
      for (const r of ready) {
        const a = r.analysis!;
        const ext = r.file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("item-photos").upload(path, r.file);
        if (upErr) throw upErr;
        toInsert.push({
          user_id: userId,
          title: a.title, category: a.category, brand: a.brand,
          condition: a.condition, description: a.description, keywords: a.keywords,
          price_low: a.price_low, price_high: a.price_high, suggested_price: a.suggested_price,
          cost: r.cost ? Number(r.cost) : 0,
          image_path: path, status: "draft",
        });
      }
      const { error: insErr } = await supabase.from("items").insert(toInsert);
      if (insErr) throw insErr;
      router.push("/inventory");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setPhase("review");
    }
  }

  const readyCount = rows.filter((r) => r.status === "ready").length;

  return (
    <>
      <Link href="/add" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Add a find
      </Link>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">The haul</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Add multiple finds</h1>

      {error && <p className="mb-4 rounded-lg bg-ember-tint px-4 py-2.5 text-sm text-ember">{error}</p>}

      {phase === "select" && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
            className="grid cursor-pointer place-items-center rounded-xl2 border-2 border-dashed border-line-strong bg-paper-raised p-14 text-center hover:border-fox"
          >
            <div className="text-ink-muted">
              <Upload className="mx-auto mb-3" />
              <p className="font-medium text-ink">Drop up to {MAX} photos, or click to choose</p>
              <p className="mt-1 text-xs">Each photo becomes one find. One AI read per photo.</p>
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); }} />
        </>
      )}

      {phase === "analyzing" && (
        <div>
          <div className="mb-4 flex items-center gap-3 text-sm text-ink-muted">
            <Loader2 className="animate-spin text-fox" size={18} />
            Analyzing {progress.done} of {progress.total}&hellip;
          </div>
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk">
            <div className="h-full bg-fox transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {rows.map((r) => (
              <div key={r.id} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-paper-sunk">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.preview} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 grid place-items-center bg-ink/30">
                  {r.status === "analyzing" && <Loader2 className="animate-spin text-paper" size={18} />}
                  {r.status === "ready" && <Check className="text-paper" size={18} />}
                  {r.status === "error" && <X className="text-paper" size={18} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === "review" || phase === "saving") && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {readyCount} of {rows.length} ready. Edit anything, then save.
            </p>
            <button
              onClick={saveAll}
              disabled={phase === "saving" || readyCount === 0}
              className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
            >
              {phase === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {phase === "saving" ? "Saving…" : `Save ${readyCount} to inventory`}
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex gap-4 rounded-xl2 border border-line bg-paper-raised p-3 shadow-card">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-paper-sunk">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.preview} alt="" className="h-full w-full object-cover" />
                </div>

                {r.status === "error" ? (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm text-ember">Couldn&rsquo;t read this photo. {r.error}</span>
                    <button onClick={() => removeRow(r.id)} className="text-sm text-ink-muted hover:text-ink">Remove</button>
                  </div>
                ) : r.analysis ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <input className={`${inp} font-medium`} value={r.analysis.title} onChange={(e) => patch(r.id, { title: e.target.value })} />
                      <button onClick={() => removeRow(r.id)} className="mt-1 text-ink-muted hover:text-ember" title="Remove"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <label className="text-xs text-ink-muted">Category
                        <input className={inp} value={r.analysis.category} onChange={(e) => patch(r.id, { category: e.target.value })} />
                      </label>
                      <label className="text-xs text-ink-muted">Condition
                        <input className={inp} value={r.analysis.condition} onChange={(e) => patch(r.id, { condition: e.target.value })} />
                      </label>
                      <label className="text-xs text-ink-muted">Price
                        <input className={inp} type="number" value={r.analysis.suggested_price} onChange={(e) => patch(r.id, { suggested_price: Number(e.target.value) })} />
                      </label>
                      <label className="text-xs text-ink-muted">Cost
                        <input className={inp} type="number" value={r.cost} placeholder="0" onChange={(e) => setCost(r.id, e.target.value)} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center text-sm text-ink-muted">
                    <Loader2 className="mr-2 animate-spin" size={16} /> Working&hellip;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function toBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
