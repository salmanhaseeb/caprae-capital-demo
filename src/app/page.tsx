import { SearchPage } from "@/components/leads/search-page";
import type { SearchParams } from "@/lib/lead-search";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <SearchPage searchParams={searchParams} />;
}
