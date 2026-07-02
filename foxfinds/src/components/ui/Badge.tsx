import type { ItemStatus } from "@/types";

const MAP: Record<string, string> = {
  draft: "bg-paper-sunk text-ink-muted",
  listed: "bg-fox-tint text-fox-deep",
  sold: "bg-moss-tint text-moss",
  archived: "bg-paper-sunk text-ink-muted",
  posted: "bg-fox-tint text-fox-deep",
};

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${MAP[status] ?? MAP.draft}`}>
      {status}
    </span>
  );
}
