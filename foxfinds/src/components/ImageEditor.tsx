"use client";
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "@/lib/cropImage";
import { RotateCcw, RotateCw, Loader2, Check, X } from "lucide-react";

type Area = { x: number; y: number; width: number; height: number };

export default function ImageEditor({
  src, onSave, onClose,
}: { src: string; onSave: (blob: Blob) => Promise<void> | void; onClose: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

  async function save() {
    if (!areaPixels) return;
    setSaving(true); setError(null);
    try {
      const blob = await getCroppedBlob(src, areaPixels, rotation);
      await onSave(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the image.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl2 border border-line bg-paper-raised shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-medium">Adjust photo</span>
          <button onClick={onClose} aria-label="Close" className="-mr-2 rounded-lg p-2 text-ink-muted hover:bg-paper-sunk"><X size={18} /></button>
        </div>

        <div className="relative h-72 w-full bg-ink/90">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition={false}
          />
        </div>

        <div className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">Zoom</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-fox" />
          </label>

          <div className="flex items-center gap-2">
            <button onClick={() => setRotation((r) => (r - 90 + 360) % 360)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-paper-sunk">
              <RotateCcw size={15} /> Left
            </button>
            <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-paper-sunk">
              <RotateCw size={15} /> Right
            </button>
            <span className="ml-auto text-xs text-ink-muted">Drag to reposition · pinch or slider to zoom</span>
          </div>

          {error && <p className="text-sm text-ember">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save photo
            </button>
            <button onClick={onClose} disabled={saving} className="rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-paper-sunk disabled:opacity-60">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}