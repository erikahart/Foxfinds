"use client";
import { useState } from "react";
import { checkZip, PICKUP_CITY, type ZipResult } from "@/lib/fulfillment";
import { Truck, Check, X } from "lucide-react";

export default function DeliveryChecker({ onResult }: { onResult?: (summary: string) => void }) {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<ZipResult | null>(null);

  function run(e: React.FormEvent) {
    e.preventDefault();
    const r = checkZip(zip);
    setResult(r);
    if (onResult) {
      if (r.status === "delivery") onResult(`Delivery to ${zip} (~${Math.round(r.miles)} mi · $${r.fee} delivery fee)`);
      else if (r.status === "outside") onResult(`Pickup only — ZIP ${zip} is ~${Math.round(r.miles)} mi (outside delivery area)`);
      else if (r.status === "unknown") onResult(`ZIP ${zip} — please confirm delivery with seller`);
      else onResult("");
    }
  }

  return (
    <div className="rounded-xl2 border border-line bg-paper-raised p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-medium"><Truck size={16} className="text-fox-deep" /> Check delivery to your ZIP</div>
      <form onSubmit={run} className="mt-2 flex items-center gap-2">
        <input
          inputMode="numeric"
          maxLength={5}
          placeholder="e.g. 44035"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          className="w-32 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-fox focus:ring-2 focus:ring-fox/20"
        />
        <button type="submit" disabled={zip.length < 5} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-fox hover:bg-fox-tint disabled:opacity-60">Check</button>
      </form>

      {result && (
        <div className="mt-2 text-sm">
          {result.status === "delivery" && (
            <p className="flex items-center gap-1.5 text-moss"><Check size={15} /> Delivery available — about {Math.round(result.miles)} mi, ${result.fee} delivery fee.</p>
          )}
          {result.status === "outside" && (
            <p className="flex items-center gap-1.5 text-ink-soft"><X size={15} /> About {Math.round(result.miles)} mi — outside the delivery area. Pickup in {PICKUP_CITY}.</p>
          )}
          {result.status === "unknown" && (
            <p className="text-ink-soft">We couldn&rsquo;t place that ZIP automatically — message us and we&rsquo;ll confirm, or pick up in {PICKUP_CITY}.</p>
          )}
        </div>
      )}
    </div>
  );
}