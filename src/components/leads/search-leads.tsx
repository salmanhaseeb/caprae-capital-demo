"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  History,
  LoaderCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatRevenue,
  parseLeadSearch,
  PAGE_SIZE,
  searchUrl,
  EMPTY_FILTERS,
  type SearchFilters,
  type SearchResult,
} from "@/lib/lead-search";
import { RelationshipMemoryBadge } from "./relationship-memory-badge";
import { SearchLoading } from "./search-loading";
export function SearchLeads({
  result,
  filters,
  error,
  organizationName,
}: {
  result: SearchResult | null;
  filters: SearchFilters;
  error?: string;
  organizationName: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [draft, setDraft] = useState(filters);
  const [pending, startTransition] = useTransition();
  const [validation, setValidation] = useState("");
  const validationRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (validation) validationRef.current?.focus(); }, [validation]);
  function navigate(next: SearchFilters, page = 1) {
    startTransition(() => {
      router.push(searchUrl(path, next, page), { scroll: false });
      router.refresh();
    });
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed = parseLeadSearch(draft);
      setValidation("");
      navigate(parsed.filters);
    } catch (cause) {
      setValidation(
        cause instanceof Error ? cause.message : "Check your filter values.",
      );
    }
  }
  function clear() {
    setDraft({ ...EMPTY_FILTERS });
    setValidation("");
    navigate({ ...EMPTY_FILTERS });
  }
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <div className="page-enter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold">
            Find your next opportunity.
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            Discover the right companies. Pick up where your team left off.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-primary" />
          {organizationName}&apos;s relationships
        </span>
      </div>
      <form
        onSubmit={submit}
        className="subtle-shadow mb-6 rounded-xl border bg-white p-5"
        aria-label="Lead filters"
      >
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={16} className="text-primary" />
          Find your ideal companies
        </h2>
        <fieldset
          disabled={pending}
          className="grid gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="xl:col-span-2">
            <label
              htmlFor="industry"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              Industry
            </label>
            <Input
              id="industry"
              name="industry"
              list="lead-industries"
              value={draft.industry}
              onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
              placeholder="All industries"
              autoComplete="off"
              className="h-10 bg-white text-sm"
            />
            <datalist id="lead-industries">
              {result?.industries.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="xl:col-span-2">
            <label
              htmlFor="location"
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              Location
            </label>
            <Input
              id="location"
              name="location"
              list="lead-locations"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="City or state, e.g. Austin or TX"
              autoComplete="off"
              className="h-10 bg-white text-sm"
            />
            <datalist id="lead-locations">
              {result?.locations.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          {(
            [
              {
                key: "minEmployees",
                label: "Minimum employees",
                placeholder: "No minimum",
                step: "1",
              },
              {
                key: "maxEmployees",
                label: "Maximum employees",
                placeholder: "No maximum",
                step: "1",
              },
              {
                key: "minRevenue",
                label: "Minimum revenue",
                placeholder: "No minimum",
                step: "0.01",
              },
              {
                key: "maxRevenue",
                label: "Maximum revenue",
                placeholder: "No maximum",
                step: "0.01",
              },
            ] as const
          ).map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="mb-2 block text-xs font-medium text-muted-foreground"
              >
                {field.label}
                {field.key.includes("Revenue") && (
                  <span className="ml-1 text-xs font-normal">
                    (USD / year)
                  </span>
                )}
              </label>
              <Input
                id={field.key}
                name={field.key}
                aria-invalid={!!validation && validation.toLowerCase().includes(field.key.includes("Employees") ? "employees" : "revenue")}
                aria-describedby={validation ? "filter-validation" : undefined}
                type="number"
                min="0"
                max={field.key.includes("Employees") ? "2147483647" : undefined}
                step={field.step}
                value={draft[field.key]}
                onChange={(e) =>
                  setDraft({ ...draft, [field.key]: e.target.value })
                }
                placeholder={field.placeholder}
                className="h-10 bg-white text-sm"
              />
            </div>
          ))}
        </fieldset>
        {validation && (
          <p ref={validationRef} id="filter-validation" tabIndex={-1} role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-destructive">
            {validation}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Search the shared catalog with your team&apos;s private context.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={clear}
              disabled={pending}
              className="text-xs"
            >
              <X size={14} />
              Clear filters
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="min-w-24 text-xs"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" size={14} />
              ) : (
                <Search size={14} />
              )}
              Search
            </Button>
          </div>
        </div>
      </form>
      {pending ? (
        <SearchLoading />
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50/40 p-7"
        >
          <h2 className="text-sm font-semibold">
            We couldn&apos;t load your companies
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(filters, result?.page ?? 1)}
            className="mt-4 text-xs"
          >
            Try again
          </Button>
        </div>
      ) : (
        result && (
          <section
            aria-label="Lead search results"
            className="subtle-shadow overflow-hidden rounded-xl border bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                Search results
                <span
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  data-testid="result-count"
                >
                  {result.total}
                </span>
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History size={13} />
                {hasFilters ? "Filtered companies" : "All companies"} · A–Z
              </p>
            </div>
            {result.total === 0 ? (
              <div className="border-t px-6 py-16 text-center">
                <Search size={28} className="mx-auto mb-4 text-[#9eb09e]" />
                <h3 className="text-sm font-semibold">
                  {hasFilters
                    ? "No companies match your filters"
                    : "Your company catalog is empty"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {hasFilters
                    ? "Try a broader employee or revenue range, or clear your filters."
                    : "Your workspace’s company catalog is not available yet. Check back shortly."}
                </p>
                {hasFilters && (
                  <Button
                    onClick={clear}
                    variant="outline"
                    className="mt-5 text-xs"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <p className="border-t px-5 py-2 text-xs text-muted-foreground xl:hidden">Scroll horizontally to view all company details and relationship history.</p>
                <div role="region" aria-label="Company search results" tabIndex={0} className="relative overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary">
                  <table className="w-full min-w-[1080px] border-collapse text-left">
                    <caption className="sr-only">
                      Companies with relationship context for {organizationName}
                    </caption>
                    <thead>
                      <tr className="border-y bg-[#fafbf9] text-xs tracking-wide text-muted-foreground">
                        {[
                          "Company",
                          "Industry",
                          "Location",
                          "Employees",
                          "Estimated Revenue",
                          "CEO",
                          "Relationship",
                        ].map((title) => (
                          <th
                            key={title}
                            scope="col"
                            className={`px-4 py-3 font-semibold first:pl-5 ${["Employees", "Estimated Revenue"].includes(title) ? "text-right" : ""}`}
                          >
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.companies.map((company) => (
                        <tr
                          key={company.id}
                          className={`border-b border-[#edf0ed] transition-colors ${company.relationshipStatus === "DO_NOT_CONTACT" ? "bg-red-50/70 hover:bg-red-50" : "hover:bg-[#fafcf9]"}`}
                        >
                          <td className="min-w-[230px] py-4 pl-5 pr-4">
                            <Link
                              href={`/companies/${encodeURIComponent(company.id)}`}
                              className="group flex items-center gap-3"
                            >
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#edf3ec] text-[#65835c]">
                                <Building2 size={17} />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold group-hover:text-primary group-hover:underline">
                                  {company.name}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  {company.domain}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 text-sm text-muted-foreground">
                            {company.industry ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 text-sm text-muted-foreground">
                            {company.location ?? "—"}
                          </td>
                          <td className="px-4 text-right text-sm tabular-nums text-muted-foreground">
                            {company.employeeCount?.toLocaleString("en-US") ??
                              "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 text-right text-sm tabular-nums text-muted-foreground">
                            {formatRevenue(company.estimatedRevenue)}
                          </td>
                          <td className="px-4 text-sm text-muted-foreground">
                            {company.ceoName ?? "—"}
                          </td>
                          <td className="px-4">
                            <RelationshipMemoryBadge
                              key={`${organizationName}-${company.id}`}
                              company={company}
                              organizationName={organizationName}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {(result.page - 1) * PAGE_SIZE + 1}–
                    {Math.min(result.page * PAGE_SIZE, result.total)} of{" "}
                    {result.total} companies
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Previous page"
                      disabled={result.page === 1}
                      onClick={() => navigate(filters, result.page - 1)}
                      className="size-8"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {result.page} of {result.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Next page"
                      disabled={result.page === result.totalPages}
                      onClick={() => navigate(filters, result.page + 1)}
                      className="size-8"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        )
      )}
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={12} />
        Company data is shared. Your relationships are yours.
      </p>
    </div>
  );
}
