import type { Marketplace } from "@/types";

interface MarketplaceSpec {
  id: Marketplace;
  name: string;
  titleMax: number;
  tagMax: number;      // max number of tags/keywords
  feePct: number;      // approximate selling fee, for take-home estimates
  note: string;
}

export const MARKETPLACES: Record<Marketplace, MarketplaceSpec> = {
  ebay: {
    id: "ebay", name: "eBay", titleMax: 80, tagMax: 0, feePct: 0.1335,
    note: "Keyword-dense titles. Item specifics matter for search.",
  },
  etsy: {
    id: "etsy", name: "Etsy", titleMax: 140, tagMax: 13, feePct: 0.095,
    note: "Vintage/handmade framing. 13 tags, 20 chars each.",
  },
  poshmark: {
    id: "poshmark", name: "Poshmark", titleMax: 50, tagMax: 0, feePct: 0.20,
    note: "Fashion-forward, brand-led. Flat 20% fee over $15.",
  },
  mercari: {
    id: "mercari", name: "Mercari", titleMax: 80, tagMax: 3, feePct: 0.10,
    note: "Casual tone, quick sales, competitive pricing.",
  },
  facebook: {
    id: "facebook", name: "Facebook Marketplace", titleMax: 100, tagMax: 0, feePct: 0,
    note: "Local pickup framing. No selling fee for local.",
  },
};

export const MARKETPLACE_LIST = Object.values(MARKETPLACES);

/** Estimated take-home after marketplace fees. */
export function takeHome(price: number, marketplace: Marketplace): number {
  return Math.round(price * (1 - MARKETPLACES[marketplace].feePct) * 100) / 100;
}
