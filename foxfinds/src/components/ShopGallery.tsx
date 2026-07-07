"use client";
import { useState } from "react";

export default function ShopGallery({ urls, title }: { urls: string[]; title: string }) {
  const photos = urls.filter(Boolean);
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return <div className="grid aspect-square place-items-center rounded-xl2 border border-line bg-paper-sunk text-ink-muted">No photo</div>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl2 border border-line bg-paper-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[active]} alt={title} className="w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((u, i) => (
            <button
              key={u}
              onClick={() => setActive(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-ink" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}