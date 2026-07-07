import { PICKUP_CITY, DELIVERY_TIERS, MAX_DELIVERY_MILES } from "@/lib/fulfillment";
import { MapPin } from "lucide-react";

export default function FulfillmentNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl2 border border-line bg-paper-sunk p-3 text-sm text-ink-soft ${className}`}>
      <MapPin size={16} className="mt-0.5 flex-shrink-0 text-fox-deep" />
      <div>
        <span className="font-medium text-ink">Pickup</span> in {PICKUP_CITY}.{" "}
        <span className="font-medium text-ink">Delivery</span> within {MAX_DELIVERY_MILES} mi —{" "}
        {DELIVERY_TIERS.map((t) => `$${t.fee} ≤${t.maxMiles} mi`).join(", ")}.
      </div>
    </div>
  );
}