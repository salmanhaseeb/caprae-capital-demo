import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import type { Interaction } from "@/generated/prisma/client";
import { relationshipStatusLabels, sellerReadinessLabels } from "@/lib/interactions";
import { relationshipAnalysisSchema } from "@/server/relationship-analysis";

const statuses = {
  NEW: "New", COLD: "Cold", WARM: "Warm", INTERESTED: "Interested",
  FOLLOW_UP: "Follow Up", DO_NOT_CONTACT: "Do Not Contact",
};
const readiness = { UNKNOWN: "Unknown", LOW: "Low", MEDIUM: "Medium", HIGH: "High" };
const sentiments = { UNKNOWN: "Unknown", NEGATIVE: "Negative", NEUTRAL: "Neutral", POSITIVE: "Positive", MIXED: "Mixed" };
const succession = { UNKNOWN: "Unknown", NONE: "No signal recorded", POSSIBLE: "Possible", CONFIRMED: "Confirmed" };

// Receives only the latest interaction from the page's organization-scoped query.
// Rendering uses stored data exclusively; it never makes an AI request.
export function RelationshipIntelligenceCard({ latest, isSuppressed, organizationName }: {
  latest: Interaction;
  isSuppressed: boolean;
  organizationName: string;
}) {
  const parsed = relationshipAnalysisSchema.safeParse(latest.aiAnalysis);
  const ai = !latest.analysisFailed && parsed.success ? parsed.data : null;
  const status = isSuppressed ? "Do Not Contact" : ai ? statuses[ai.relationshipStatus] : relationshipStatusLabels[latest.relationshipStatus];
  const action = isSuppressed
    ? "Do not contact. Outreach is suppressed for this organization."
    : latest.analysisFailed ? "No AI recommendation available for this interaction." : ai?.recommendedAction || latest.recommendedAction || "No recommended action recorded.";
  // Quote stored context/summary rather than generating a causal explanation.
  const reason = isSuppressed && latest.relationshipStatus !== "DO_NOT_CONTACT"
    ? "An earlier interaction is marked Do Not Contact."
    : latest.analysisFailed ? null : ai?.keyContext.trim() || ai?.summary.trim() || latest.aiSummary?.trim() || null;
  const followUp = isSuppressed ? "Outreach suppressed" : latest.nextFollowUpAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(latest.nextFollowUpAt)
    : "Not scheduled";
  const fields = [
    ["Relationship Status", status],
    ["Seller Readiness", ai ? readiness[ai.sellerReadiness] : sellerReadinessLabels[latest.sellerReadiness]],
    ["Sentiment", latest.analysisFailed ? "Unavailable" : sentiments[ai?.sentiment ?? latest.sentiment]],
    ["Succession Signal", latest.analysisFailed ? "Unavailable" : ai ? ai.successionSignal ? "Signal recorded" : "No signal recorded" : succession[latest.successionSignal]],
    ["Next Follow-Up", followUp],
  ];
  return (
    <section aria-labelledby="ai-relationship-intelligence" className="subtle-shadow mb-6 overflow-hidden rounded-xl border border-[#d5e4cf] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e9db] bg-[#f3f7ef] px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-[#d5e4cf] bg-white text-primary"><Sparkles size={20} /></span>
          <div>
            <h2 id="ai-relationship-intelligence" className="text-base font-semibold">AI Relationship Intelligence</h2>
            <p className="mt-1 text-xs text-muted-foreground">Based on the latest recorded interaction.</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={13} />Private to {organizationName}</span>
      </div>
      <div className="p-5 sm:p-7">
        {latest.analysisFailed && <p className="mb-5 rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">AI analysis is unavailable for the latest interaction. Original notes are saved; existing relationship status and follow-up are retained.</p>}
        <dl className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-5">
          {fields.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-2 text-sm font-semibold ${label === "Relationship Status" && isSuppressed ? "text-destructive" : "text-foreground"}`}>{value}</dd></div>)}
        </dl>
        <div className="mt-6 rounded-xl border border-[#dce7d6] bg-[#f8faf5] p-4 sm:p-5">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><ArrowUpRight size={15} />Recommended Action</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-base font-semibold leading-7 text-primary">{action}</p>
          <div className="mt-4 border-t border-[#e0e9db] pt-4">
            <h3 className="text-xs font-semibold">Why this recommendation?</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{reason || "No supporting AI context was recorded for this interaction."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
