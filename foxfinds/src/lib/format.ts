export const money = (n: number | null | undefined): string =>
  n == null ? "—" : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const money2 = (n: number | null | undefined): string =>
  n == null ? "—" : `$${Number(n).toFixed(2)}`;

export function since(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
