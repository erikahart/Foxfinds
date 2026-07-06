"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Analysis } from "@/types";
import { Upload, Sparkles, RotateCcw, Check } from "lucide-react";

export default function AddFindPage() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "analyzing" | "review" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState<Analysis | null>(null);
  const [cost, setCost] = useState("");
  const [unit, setUnit] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  async function onPick(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    await analyze(f);
  }

  async function analyze(f: File) {
    setPhase("analyzing");
    try {
      const { base64, mediaType } = await toBase64(f);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, media_type: mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setA(json.analysis);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("idle");
    }
  }

  async function save() {
    if (!a || !file || !userId) return;
    setPhase("saving");
    setError(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("item-photos").upload(path, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("items").insert({
        user_id: userId,
        title: a.title,
        category: a.category,
        brand: a.brand,
        condition: a.condition,
        description: a.description,
        keywords: a.keywords,
        price_low: a.price_low,
        price_high: a.price_high,
        suggested_price: a.suggested_price,
        cost: cost ? Number(cost) : 0,
        source_unit: unit || null,
        image_path: path,
        status: "draft",
      });
      if (insErr) throw insErr;
      router.push("/inventory");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setPhase("review");
    }
  }

  function reset() {
    setFile(null); setPreview(null); setA(null); setPhase("idle");
    setError(null); setCost(""); setUnit("");
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fox-deep">Cataloguing</p>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-display text-3xl font-semibold">Add a find</h1>
        <Link href="/add/bulk" className="text-sm text-fox-deep underline underline-offset-4 hover:text-ink">
          Got a whole haul? Add several &rarr;
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-ember-tint px-4 py-2.5 text-sm text-ember">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[minmax(0,340px)_1fr]">
        {/* Photo column */}
        <div>
          <div
            onClick={() => phase === "idle" && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && phase === "idle") onPick(f); }}
            className={`grid aspect-square place-items-center overflow-hidden rounded-xl2 border-2 border-dashed bg-paper-raised text-center ${
              phase === "idle" ? "cursor-pointer border-line-strong hover:border-fox" : "border-line"
            }`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected find" className="h-full w-full object-cover" />
            ) : (
              <div className="p-6 text-ink-muted">
                <Upload className="mx-auto mb-3" />
                <p className="font-medium text-ink">Drop a photo or click to upload</p>
                <p className="mt-1 text-xs">JPG, PNG, or WebP</p>
              </div>
            )}
          </div>
          <input
            ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
          />
          {preview && phase !== "analyzing" && (
            <button onClick={reset} className="mt-3 flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
              <RotateCcw size={15} /> Start over
            </button>
          )}
        </div>

        {/* Detail column */}
        <div>
          {phase === "idle" && !a && (
            <div className="rounded-xl2 border border-line bg-paper-raised p-6 text-sm text-ink-muted shadow-card">
              Upload a photo and the AI will identify the item, estimate its resale value, and draft a description you can edit before saving.
            </div>
          )}

          {phase === "analyzing" && (
            <div className="flex items-center gap-3 rounded-xl2 border border-line bg-paper-raised p-6 shadow-card">
              <Sparkles className="animate-pulse text-fox" />
              <span className="text-sm text-ink-muted">Reading the find&hellip; identifying, dating, and pricing.</span>
            </div>
          )}

          {a && (phase === "review" || phase === "saving") && (
            <div className="space-y-4 rounded-xl2 border border-line bg-paper-raised p-6 shadow-card">
              <Row label="Title"><input className={inp} value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Category"><input className={inp} value={a.category} onChange={(e) => setA({ ...a, category: e.target.value })} /></Row>
                <Row label="Brand"><input className={inp} value={a.brand ?? ""} onChange={(e) => setA({ ...a, brand: e.target.value })} /></Row>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Row label="Condition"><input className={inp} value={a.condition} onChange={(e) => setA({ ...a, condition: e.target.value })} /></Row>
                <Row label="Cost"><input className={inp} type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} /></Row>
                <Row label="Source unit"><input className={inp} placeholder="Unit 104" value={unit} onChange={(e) => setUnit(e.target.value)} /></Row>
              </div>
              <Row label="Description">
                <textarea className={`${inp} min-h-[92px] resize-y`} value={a.description} onChange={(e) => setA({ ...a, description: e.target.value })} />
              </Row>
              <div className="grid grid-cols-3 gap-3">
                <Row label="Price low"><input className={inp} type="number" value={a.price_low} onChange={(e) => setA({ ...a, price_low: Number(e.target.value) })} /></Row>
                <Row label="Suggested"><input className={inp} type="number" value={a.suggested_price} onChange={(e) => setA({ ...a, suggested_price: Number(e.target.value) })} /></Row>
                <Row label="Price high"><input className={inp} type="number" value={a.price_high} onChange={(e) => setA({ ...a, price_high: Number(e.target.value) })} /></Row>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-paper-sunk px-2.5 py-0.5 text-xs text-ink-muted">{k}</span>
                ))}
              </div>

              <button
                onClick={save}
                disabled={phase === "saving"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
              >
                <Check size={17} /> {phase === "saving" ? "Saving to inventory…" : "Save to inventory"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const inp =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
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
