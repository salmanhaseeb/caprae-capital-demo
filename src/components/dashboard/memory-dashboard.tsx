"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, History, Search, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/layout/demo-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyMark, PageHeading } from "./shared";
import { LeadRelationshipBadge } from "@/components/leads/relationship-badge";
import type { RelationshipLabel } from "@/lib/lead-search";
type RememberedCompany = {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  relationship: RelationshipLabel;
  summary: string;
  interactionCount: number;
  lastInteractionAt: string;
};
export function MemoryDashboard({
  companies,
}: {
  companies: RememberedCompany[];
}) {
  const { organization } = useDemo();
  const [query, setQuery] = useState("");
  const filtered = companies.filter((company) =>
    company.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page-enter">
      <PageHeading
        title="Relationship Memory"
        description="Your team’s conversations, context, and next steps. All in one place."
      >
        <span className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-primary" />
          {organization.name} only
        </span>
      </PageHeading>
      <div className="mb-7 flex items-center gap-4 rounded-xl border border-[#dfe7d9] bg-[#f0f5ed] p-5">
        <History size={24} className="shrink-0 text-[#648758]" />
        <div>
          <h2 className="text-sm font-medium text-[#4e6944]">
            Your team’s relationship history
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#718367]">
            {companies.reduce(
              (sum, company) => sum + company.interactionCount,
              0,
            )}{" "}
            recorded interactions helping your team make the next conversation
            better.
          </p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Remembered companies{" "}
          <span className="ml-2 text-xs text-muted-foreground">
            {filtered.length}
          </span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <Input
            aria-label="Search relationship memory"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your memory..."
            className="h-9 bg-white pl-9 text-xs md:text-xs"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((company) => (
          <article
            key={company.id}
            className="subtle-shadow flex flex-col transition-shadow hover:shadow-md rounded-xl border bg-white p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <CompanyMark company={company} />
              <div className="min-w-0 break-words">
                <h3 className="text-sm font-semibold">{company.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {company.industry ?? "Industry unknown"} ·{" "}
                  {company.location ?? "Location unknown"}
                </p>
              </div>
            </div>
            <div>
              <LeadRelationshipBadge label={company.relationship} />
            </div>
            <p className="my-4 flex-1 text-sm leading-6 text-muted-foreground">
              {company.summary}
            </p>
            <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
              <span>{company.interactionCount} {company.interactionCount === 1 ? "interaction" : "interactions"}</span>
              <time dateTime={company.lastInteractionAt}>
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(company.lastInteractionAt))}
              </time>
            </div>
            <Link
              href={`/companies/${encodeURIComponent(company.id)}`}
              className="mt-4 flex items-center justify-between rounded-md bg-[#f6f8f4] px-3 py-2 text-xs text-[#64775a]"
            >
              Open relationship history
              <ArrowRight size={13} />
            </Link>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-sm font-medium">No relationships found</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            {query
              ? "Try another company name."
              : "Your organization has not recorded any interactions yet."}
          </p>
          {query ? <Button variant="outline" className="mt-5" onClick={() => setQuery("")}>Clear search</Button> : <Button asChild className="mt-5"><Link href="/">Find companies</Link></Button>}
        </div>
      )}
    </div>
  );
}
