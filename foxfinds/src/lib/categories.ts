// The standard, assignable categories you tag an item with.
export const CATEGORIES = [
  "Furniture",
  "Home Decor",
  "Tools",
  "Electronics",
  "Collectibles",
  "Vintage/Antique",
  "Kitchen",
  "Clothing",
  "Jewelry",
];

// Shop browse buttons: the categories above plus two smart filters.
// "New Arrivals" = recently listed; "Under $25" = price filter.
export const SHOP_FILTERS = ["All", ...CATEGORIES, "New Arrivals", "Under $25"];