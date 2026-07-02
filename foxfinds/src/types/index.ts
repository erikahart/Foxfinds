export type ItemStatus = "draft" | "listed" | "sold" | "archived";

export type Marketplace = "ebay" | "etsy" | "poshmark" | "mercari" | "facebook";

export interface Item {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  brand: string | null;
  condition: string | null;
  description: string | null;
  keywords: string[];
  price_low: number | null;
  price_high: number | null;
  suggested_price: number | null;
  cost: number;
  sold_price: number | null;
  image_path: string | null;
  status: ItemStatus;
  source_unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  item_id: string;
  user_id: string;
  marketplace: Marketplace;
  title: string | null;
  description: string | null;
  price: number | null;
  tags: string[];
  status: "draft" | "posted" | "sold";
  external_url: string | null;
  created_at: string;
}

/** Shape returned by the /api/analyze vision endpoint. */
export interface Analysis {
  title: string;
  category: string;
  brand: string | null;
  condition: string;
  description: string;
  keywords: string[];
  price_low: number;
  price_high: number;
  suggested_price: number;
}
