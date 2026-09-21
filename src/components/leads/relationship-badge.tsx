import type { RelationshipLabel } from "@/lib/lead-search";
import { cn } from "@/lib/utils";
const tones: Record<RelationshipLabel, string> = {
  New: "border-[#e3e9e4] bg-[#f5f7f5] text-[#69776d]",
  "Previously Contacted": "border-[#dfe5ee] bg-[#f0f4f9] text-[#5e7391]",
  Warm: "border-[#d7e9df] bg-[#edf6f0] text-[#367651]",
  Interested: "border-[#cde6da] bg-[#e7f5ed] text-[#246749]",
  "Follow Up": "border-[#f0e3c8] bg-[#fcf7ec] text-[#92712e]",
  "Do Not Contact": "border-red-700 bg-red-700 text-white font-semibold",
};
export function LeadRelationshipBadge({ label }: { label: RelationshipLabel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium",
        tones[label],
      )}
    >
      <span className="size-1 rounded-full bg-current" />
      {label}
    </span>
  );
}
