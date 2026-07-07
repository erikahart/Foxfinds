// ── Pickup & delivery settings ───────────────────────────────────────────────
// Hard-coded for now. To change the area, radius, or fees, edit the values here.

export const PICKUP_CITY = "Wellington, OH";
export const PICKUP_ZIP = "44090";
const PICKUP = { lat: 41.1673, lng: -82.2179 }; // Wellington, OH

// Delivery fee tiers by straight-line distance (checked in order, smallest first).
export const DELIVERY_TIERS: { maxMiles: number; fee: number }[] = [
  { maxMiles: 15, fee: 10 },
  { maxMiles: 30, fee: 20 },
];
export const MAX_DELIVERY_MILES = DELIVERY_TIERS[DELIVERY_TIERS.length - 1].maxMiles;

// Local ZIP → [lat, lng]. Approximate centroids for the service area around
// Wellington. ZIPs not listed return "unknown" (buyer is asked to message).
const ZIPS: Record<string, [number, number]> = {
  "44090": [41.1673, -82.2179], // Wellington
  "44074": [41.2939, -82.2171], // Oberlin
  "44049": [41.2703, -82.3049], // Kipton
  "44050": [41.2384, -82.1210], // LaGrange
  "44044": [41.2734, -82.0546], // Grafton
  "44889": [41.2517, -82.4001], // Wakeman
  "44851": [41.0850, -82.4001], // New London
  "44001": [41.3776, -82.2226], // Amherst
  "44035": [41.3684, -82.1071], // Elyria
  "44036": [41.3684, -82.1071], // Elyria
  "44039": [41.3892, -82.0193], // North Ridgeville
  "44052": [41.4530, -82.1746], // Lorain
  "44053": [41.4109, -82.2085], // Lorain
  "44055": [41.4353, -82.1215], // Lorain
  "44054": [41.4900, -82.0968], // Sheffield Lake
  "44011": [41.4515, -82.0354], // Avon
  "44012": [41.5050, -82.0280], // Avon Lake
  "44028": [41.3179, -81.9349], // Columbia Station
  "44256": [41.1384, -81.8632], // Medina
  "44275": [41.0973, -82.1207], // Spencer
  "44273": [41.0148, -81.8632], // Seville
  "44215": [41.0684, -81.9143], // Chippewa Lake
  "44212": [41.2381, -81.8418], // Brunswick
  "44254": [41.0334, -82.0135], // Lodi
  "44805": [40.8686, -82.3182], // Ashland
  "44857": [41.2426, -82.6157], // Norwalk
  "44839": [41.3901, -82.5546], // Huron
  "44870": [41.4489, -82.7082], // Sandusky
  "44089": [41.4200, -82.3640], // Vermilion
  "44837": [41.0384, -82.5157], // Greenwich
  "44890": [41.0534, -82.7266], // Willard
  "44233": [41.2400, -81.7400], // Hinckley
  "44136": [41.3120, -81.8310], // Strongsville
  "44149": [41.2980, -81.8080], // Strongsville
  "44070": [41.4150, -81.9230], // North Olmsted
  "44138": [41.3750, -81.9090], // Olmsted Falls
  "44017": [41.3660, -81.8550], // Berea
  "44133": [41.3130, -81.7240], // North Royalton
  "44280": [41.2400, -81.9300], // Valley City
  "44691": [40.8051, -81.9351], // Wooster
};

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8; // miles
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type ZipResult =
  | { status: "pickup_here"; miles: number }
  | { status: "delivery"; miles: number; fee: number }
  | { status: "outside"; miles: number }
  | { status: "unknown" };

export function checkZip(zipRaw: string): ZipResult {
  const zip = (zipRaw || "").trim().slice(0, 5);
  const c = ZIPS[zip];
  if (!c) return { status: "unknown" };
  const miles = haversineMiles(PICKUP.lat, PICKUP.lng, c[0], c[1]);
  const tier = DELIVERY_TIERS.find((t) => miles <= t.maxMiles);
  if (tier) return { status: "delivery", miles, fee: tier.fee };
  return { status: "outside", miles };
}

export function deliverySummary(): string {
  const tiers = DELIVERY_TIERS.map((t) => `$${t.fee} within ${t.maxMiles} mi`).join(", ");
  return `Pickup in ${PICKUP_CITY}. Delivery available within ${MAX_DELIVERY_MILES} mi (${tiers}).`;
}