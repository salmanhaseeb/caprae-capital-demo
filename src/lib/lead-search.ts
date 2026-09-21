export const PAGE_SIZE = 10;
export type SearchFilters = {
  industry: string;
  location: string;
  minEmployees: string;
  maxEmployees: string;
  minRevenue: string;
  maxRevenue: string;
};
export const EMPTY_FILTERS: SearchFilters = {
  industry: "",
  location: "",
  minEmployees: "",
  maxEmployees: "",
  minRevenue: "",
  maxRevenue: "",
};
export type RelationshipLabel =
  | "New"
  | "Previously Contacted"
  | "Warm"
  | "Follow Up"
  | "Interested"
  | "Do Not Contact";
export type RelationshipMetadata = {
  hasHistory: boolean;
  lastContactedAt: string | null;
  relationshipStatus: "NEW" | "COLD" | "WARM" | "FOLLOW_UP" | "INTERESTED" | "DO_NOT_CONTACT";
  nextFollowUpAt: string | null;
  interactionCount: number;
  recommendedAction: string | null;
};
export type LeadRow = RelationshipMetadata & {
  id: string;
  name: string;
  domain: string;
  industry: string | null;
  location: string | null;
  employeeCount: number | null;
  estimatedRevenue: string | null;
  ceoName: string | null;
  relationship: RelationshipLabel;
};
export type SearchResult = {
  companies: LeadRow[];
  total: number;
  page: number;
  totalPages: number;
  industries: string[];
  locations: string[];
};
export type SearchParams = Record<string, string | string[] | undefined>;
export class FilterError extends Error {}

function single(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value))
    throw new FilterError(`Provide only one value for ${key}.`);
  return (value ?? "").trim();
}
function cents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}
export function parseLeadSearch(params: SearchParams) {
  const filters = { ...EMPTY_FILTERS };
  for (const key of Object.keys(filters) as (keyof SearchFilters)[])
    filters[key] = single(params, key);
  if (filters.industry.length > 100 || filters.location.length > 200)
    throw new FilterError("Industry or location is too long.");
  for (const key of ["minEmployees", "maxEmployees"] as const) {
    if (
      filters[key] &&
      (!/^\d+$/.test(filters[key]) || Number(filters[key]) > 2_147_483_647)
    )
      throw new FilterError(
        "Employees must be whole numbers between 0 and 2,147,483,647.",
      );
  }
  for (const key of ["minRevenue", "maxRevenue"] as const) {
    if (filters[key] && !/^\d{1,16}(\.\d{1,2})?$/.test(filters[key]))
      throw new FilterError(
        "Revenue must be a non-negative USD amount with at most two decimal places and 16 whole-number digits.",
      );
  }
  if (
    filters.minEmployees &&
    filters.maxEmployees &&
    Number(filters.minEmployees) > Number(filters.maxEmployees)
  )
    throw new FilterError("Minimum employees cannot exceed maximum employees.");
  if (
    filters.minRevenue &&
    filters.maxRevenue &&
    cents(filters.minRevenue) > cents(filters.maxRevenue)
  )
    throw new FilterError("Minimum revenue cannot exceed maximum revenue.");
  const pageValue = single(params, "page");
  if (
    pageValue &&
    (!/^\d+$/.test(pageValue) ||
      Number(pageValue) < 1 ||
      !Number.isSafeInteger(Number(pageValue)))
  )
    throw new FilterError("Page must be a positive whole number.");
  return { filters, page: pageValue ? Number(pageValue) : 1 };
}
export function relationshipLabel(
  latest:
    | {
        relationshipStatus: string;
        sellerReadiness: string;
        nextFollowUpAt: Date | null;
      }
    | undefined,
  doNotContact: boolean,
): RelationshipLabel {
  if (!latest) return "New";
  if (doNotContact || latest.relationshipStatus === "DO_NOT_CONTACT")
    return "Do Not Contact";
  // No re-opt-in is modeled: an explicit suppression remains in effect.
  if (latest.relationshipStatus === "NOT_INTERESTED")
    return "Previously Contacted";
  if (latest.relationshipStatus === "INTERESTED") return "Interested";
  if (latest.sellerReadiness === "READY") return "Interested";
  if (latest.relationshipStatus === "ENGAGED") return "Warm";
  if (latest.relationshipStatus === "NURTURING" || latest.nextFollowUpAt)
    return "Follow Up";
  return "Previously Contacted";
}
export function searchUrl(path: string, filters: SearchFilters, page = 1) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value.trim()) params.set(key, value.trim());
  if (page > 1) params.set("page", String(page));
  return params.size ? `${path}?${params}` : path;
}
export function formatRevenue(value: string | null) {
  if (value === null) return "—";
  // Display the decimal as text: never round a database Decimal through Number.
  const [whole, fraction = "00"] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}${fraction === "00" || fraction === "0" ? "" : `.${fraction.padEnd(2, "0")}`}`;
}
