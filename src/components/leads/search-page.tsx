import { SearchLeads } from "./search-leads";
import { demoOrganizations } from "@/lib/demo-identities";
import {
  EMPTY_FILTERS,
  FilterError,
  parseLeadSearch,
  type SearchFilters,
  type SearchParams,
  type SearchResult,
} from "@/lib/lead-search";
import { getDemoSession, DemoSessionError } from "@/server/demo-session";
import { searchCompanies } from "@/server/companies";
export async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let filters: SearchFilters = { ...EMPTY_FILTERS };
  let result: SearchResult | null = null;
  let error: string | undefined;
  let organizationName = "Your organization";
  let organizationId = "unavailable";
  try {
    const session = await getDemoSession();
    organizationId = session.organizationId;
    organizationName = demoOrganizations.find(
      (item) => item.id === session.organizationId,
    )!.name;
    const parsed = parseLeadSearch(params);
    filters = parsed.filters;
    result = await searchCompanies(session, filters, parsed.page);
  } catch (cause) {
    error =
      cause instanceof FilterError
        ? cause.message
        : cause instanceof DemoSessionError
        ? "Your workspace session has expired. Select your organization in the header to continue."
        : "We couldn’t retrieve your companies. Try again in a moment.";
  }
  return (
    <SearchLeads
      key={`${organizationId}:${JSON.stringify(params)}`}
      result={result}
      filters={filters}
      error={error}
      organizationName={organizationName}
    />
  );
}
