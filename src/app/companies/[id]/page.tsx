import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Globe,
  History,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { RetryState } from "@/components/feedback/retry-state";
import { getDemoSession } from "@/server/demo-session";
import { getCompanyDetails } from "@/server/companies";
import { demoOrganizations } from "@/lib/demo-identities";
import { formatRevenue } from "@/lib/lead-search";
import {
  lastContacted,
  safeWebsiteUrl,
  sellerReadinessLabels,
} from "@/lib/interactions";
import { LeadRelationshipBadge } from "@/components/leads/relationship-badge";
import { RelationshipIntelligenceCard } from "@/components/companies/relationship-intelligence-card";
import { InteractionTimeline } from "@/components/companies/interaction-timeline";
import { LogInteractionDialog } from "@/components/companies/log-interaction-dialog";
const date = (value: Date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let company: Awaited<ReturnType<typeof getCompanyDetails>>;
  let organizationName = "";
  let organizationId = "";
  try {
    const session = await getDemoSession();
    organizationId = session.organizationId;
    organizationName = demoOrganizations.find(
      (org) => org.id === organizationId,
    )!.name;
    company = await getCompanyDetails(session, id);
  } catch {
    return <RetryState title="Company information is unavailable" />;
  }
  if (!company) notFound();
  const latest = company.interactions[0];
  const contacted = lastContacted(company.interactions);
  const website = safeWebsiteUrl(company.website);
  const isSuppressed = company.relationship === "Do Not Contact";
  const logProps = {
    companyId: company.id,
    companyName: company.name,
    organizationId,
    organizationName,
    isSuppressed,
  };
  return (
    <div className="page-enter">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        Back to Search Leads
      </Link>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-[#dce7d6] bg-[#edf3ec] text-primary">
            <Building2 size={25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display break-words text-3xl font-semibold">
              {company.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 size={13} />
                {company.industry ?? "Industry unavailable"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {company.location ?? "Location unavailable"}
              </span>
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 break-all text-primary hover:underline"
                >
                  <Globe className="shrink-0" size={13} />
                  {company.website}
                  <ArrowUpRight className="shrink-0" size={12} />
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Globe size={13} />
                  Website unavailable
                </span>
              )}
            </div>
          </div>
        </div>
        <LogInteractionDialog key={`${organizationId}-header`} {...logProps} />
      </header>
      {isSuppressed && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-5 text-red-950">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-700" />
          <div>
            <LeadRelationshipBadge label="Do Not Contact" />
            <p className="mt-3 text-sm font-semibold">Do not initiate outreach to this company.</p>
            <p className="mt-1 text-sm leading-6">This relationship is marked Do Not Contact for {organizationName}. You can review all history. Logging another contact requires explicit confirmation and does not remove this restriction.</p>
          </div>
        </div>
      )}
      <section
        aria-labelledby="company-information"
        className="subtle-shadow mb-6 rounded-xl border bg-white p-5 sm:p-6"
      >
        <h2 id="company-information" className="mb-5 text-sm font-semibold">
          Company information
        </h2>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[
            [
              "Estimated revenue",
              formatRevenue(company.estimatedRevenue?.toString() ?? null),
            ],
            [
              "Employees",
              company.employeeCount?.toLocaleString("en-US") ?? "—",
            ],
            ["CEO", company.ceoName ?? "—"],
            ["Domain", company.domain],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 break-words text-base font-semibold">
                {value}
              </dd>
              {label === "Estimated revenue" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Estimated annual revenue · USD
                </p>
              )}
            </div>
          ))}
        </dl>
      </section>
      {latest && <RelationshipIntelligenceCard latest={latest} isSuppressed={isSuppressed} organizationName={organizationName} />}
      <section
        aria-labelledby="relationship-memory"
        className="subtle-shadow overflow-hidden rounded-xl border bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-[#dce7d6] bg-[#f0f5eb] text-[#68865c]">
              <History size={18} />
            </span>
            <div>
              <h2 id="relationship-memory" className="text-base font-semibold">
                Relationship Memory
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The context behind your next conversation.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={13} />
            Private to {organizationName}
          </span>
        </div>
        {!latest ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-[#e0e9dc] bg-[#f3f7ef] text-[#8aa17a]">
              <MessageSquare size={25} />
            </span>
            <h3 className="text-lg font-semibold">
              No relationship history yet
            </h3>
            <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">
              This company is a new lead for your organization.
            </p>
            <div className="flex justify-center">
              <LogInteractionDialog
                key={`${organizationId}-first`}
                {...logProps}
                first
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 bg-[#fbfcf9] px-5 py-6 sm:grid-cols-2 sm:px-7 xl:grid-cols-4">
              <div>
                <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                  Current Relationship Status
                </h3>
                <LeadRelationshipBadge label={company.relationship} />
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                  Last Contacted
                </h3>
                <p className="text-sm font-semibold">
                  {contacted ? (
                    <time dateTime={contacted.toISOString()}>
                      {date(contacted)}
                    </time>
                  ) : (
                    "No contact recorded"
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Calls, emails, meetings, LinkedIn & other contacts
                </p>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                  Next Follow-up
                </h3>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {!isSuppressed && latest.nextFollowUpAt ? (
                    <>
                      <CalendarClock size={14} className="text-primary" />
                      <time dateTime={latest.nextFollowUpAt.toISOString()}>
                        {date(latest.nextFollowUpAt)}
                      </time>
                    </>
                  ) : (
                    "Not scheduled"
                  )}
                </p>
                {isSuppressed && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Outreach suppressed
                  </p>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                  Seller Readiness
                </h3>
                <p className="text-sm font-semibold">
                  {sellerReadinessLabels[latest.sellerReadiness]}
                </p>
              </div>
            </div>
            <InteractionTimeline interactions={company.interactions} />
          </>
        )}
      </section>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={12} />
        Company profiles are shared. Your relationship history stays with your
        organization.
      </p>
    </div>
  );
}
