"use client";
import { useState } from "react";
import type { Item, Listing, Marketplace } from "@/types";
import { MARKETPLACE_LIST, takeHome } from "@/lib/marketplaces";
import { money } from "@/lib/format";
import { Sparkles, Copy, Check } from "lucide-react";

export default function ListingsWorkbench({
  items, initialListings,
}: { items: Item[]; initialListings: Listing[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [busy, setBusy] = useState<Marketplace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const forItem = listings.filter((l) => l.item_id === selectedId);

  async function generate(marketplace: Marketplace) {
    if (!selected) return;
    setBusy(marketplace);
    setError(null);
    try {
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selected.id, marketplace }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setListings((prev) => [json.listing as Listing, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
        Add a find first — then generate listings for it here.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_1fr]">
      {/* Item picker */}
      <div className="space-y-1.5">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => setSelectedId(i.id)}
            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${
              selectedId === i.id ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised hover:bg-paper-sunk"
            }`}
          >
            <div className="line-clamp-1 font-medium">{i.title}</div>
            <div className={`text-xs ${selectedId === i.id ? "text-paper/70" : "text-ink-muted"}`}>
              {money(i.suggested_price)}
            </div>
          </button>
        ))}
      </div>

      {/* Generator */}
      <div>
        {error && <p className="mb-4 rounded-lg bg-ember-tint px-4 py-2.5 text-sm text-ember">{error}</p>}

        <div className="mb-5 rounded-xl2 border border-line bg-paper-raised p-4 shadow-card">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
            Generate a draft for
          </div>
          <div className="flex flex-wrap gap-2">
            {MARKETPLACE_LIST.map((m) => (
              <button
                key={m.id}
                onClick={() => generate(m.id)}
                disabled={busy !== null}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-sm hover:border-fox hover:bg-fox-tint disabled:opacity-50"
              >
                {busy === m.id ? <Sparkles size={15} className="animate-pulse text-fox" /> : <Sparkles size={15} />}
                {m.name}
                {selected?.suggested_price != null && m.feePct > 0 && (
                  <span className="text-xs text-ink-muted">· nets {money(takeHome(selected.suggested_price, m.id))}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {forItem.length === 0 ? (
          <p className="rounded-xl2 border border-dashed border-line-strong bg-paper-raised p-8 text-center text-sm text-ink-muted">
            No drafts yet for this find. Pick a marketplace above to generate one.
          </p>
        ) : (
          <div className="space-y-4">
            {forItem.map((l) => <DraftCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function DraftCard({ listing }: { listing: Listing }) {
  const [copied, setCopied] = useState(false);
  const marketName = MARKETPLACE_LIST.find((m) => m.id === listing.marketplace)?.name ?? listing.marketplace;

  function copy() {
    const text = `${listing.title}\n\n${listing.description}\n\nPrice: ${money(listing.price)}${
      listing.tags.length ? `\nTags: ${listing.tags.join(", ")}` : ""
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="rounded-xl2 border border-line bg-paper-raised p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-fox-tint px-2.5 py-0.5 text-xs font-medium text-fox-deep">{marketName}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          {copied ? <Check size={15} className="text-moss" /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <h3 className="font-medium">{listing.title}</h3>
      <p className="mt-1.5 whitespace-pre-line text-sm text-ink-soft">{listing.description}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="font-display text-xl font-semibold">{money(listing.price)}</span>
        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.map((t) => (
              <span key={t} className="rounded-full bg-paper-sunk px-2 py-0.5 text-xs text-ink-muted">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
