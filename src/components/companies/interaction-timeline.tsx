import {
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  interactionTypeLabels,
  relationshipStatusLabels,
  relationshipStatuses,
} from "@/lib/interactions";
export type TimelineInteraction = {
  id: string;
  interactionType: keyof typeof interactionTypeLabels;
  contactName: string | null;
  createdAt: Date;
  user: { name: string };
  rawNotes: string;
  aiSummary: string | null;
  analysisFailed: boolean;
  aiAnalysis: unknown;
  relationshipStatus: (typeof relationshipStatuses)[number];
  recommendedAction: string | null;
};
const icons = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  LINKEDIN: MessageSquare,
  NOTE: MessageSquare,
  OTHER: MessageSquare,
};
export function InteractionTimeline({
  interactions,
}: {
  interactions: TimelineInteraction[];
}) {
  return (
    <div className="border-t px-5 py-7 sm:px-7">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Interaction Timeline</h3>
        <span className="text-xs text-muted-foreground">
          Newest first · Dates in UTC
        </span>
      </div>
      <ol aria-label="Interaction Timeline" className="space-y-7">
        {interactions.map((entry, index) => {
          const Icon = icons[entry.interactionType];
          const context = entry.aiAnalysis && typeof entry.aiAnalysis === "object" && "keyContext" in entry.aiAnalysis && typeof entry.aiAnalysis.keyContext === "string" ? entry.aiAnalysis.keyContext : null;
          return (
            <li
              key={entry.id}
              className="relative flex gap-3 sm:gap-4"
              data-testid="timeline-entry"
            >
              {index < interactions.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-28px] left-[17px] top-9 w-px bg-border"
                />
              )}
              <span className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-[#f7faf5] text-[#6b8760]">
                <Icon size={15} />
              </span>
              <article className="min-w-0 flex-1 rounded-xl border bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">
                      {interactionTypeLabels[entry.interactionType]}
                    </h4>
                    {entry.contactName && <p className="mt-1 text-xs text-muted-foreground">Contact: {entry.contactName}</p>}
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <UserRound size={12} />
                      Logged by {entry.user.name}
                    </p>
                  </div>
                  <time
                    dateTime={entry.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "UTC",
                    }).format(entry.createdAt)}
                  </time>
                </div>
                <div className="mt-5">
                  <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Original notes
                  </h5>
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#566653]">
                    {entry.rawNotes}
                  </p>
                </div>
                <div className="mt-4 rounded-lg border border-[#e1eadc] bg-[#f3f7ef] p-4">
                  <h5 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#688259]">
                    <Sparkles size={12} />
                    AI summary
                  </h5>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#627258]">
                    {entry.aiSummary || (entry.analysisFailed ? "AI analysis unavailable. Original notes saved." : "Not generated yet.")}
                  </p>
                </div>
                {context && <div className="mt-4 text-sm leading-6"><h5 className="font-semibold">Key context</h5><p className="whitespace-pre-wrap break-words text-muted-foreground">{context}</p></div>}
                <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-[180px_1fr]">
                  <div>
                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Relationship status
                    </h5>
                    <span className="inline-flex rounded-md border bg-muted px-2 py-1 text-xs font-medium">
                      {relationshipStatusLabels[entry.relationshipStatus]}
                    </span>
                  </div>
                  <div>
                    <h5 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <ArrowRight size={12} />
                      Recommended next action
                    </h5>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                      {entry.recommendedAction || "No next action recorded."}
                    </p>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
