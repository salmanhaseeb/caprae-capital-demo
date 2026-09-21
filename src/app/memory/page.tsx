import { RetryState } from "@/components/feedback/retry-state";
import { MemoryDashboard } from "@/components/dashboard/memory-dashboard";
import { getDemoSession } from "@/server/demo-session";
import { getRememberedCompanies } from "@/server/companies";
export default async function Page() {
  let companies: Awaited<ReturnType<typeof getRememberedCompanies>>;
  let organizationId: string;
  try {
    const session = await getDemoSession();
    organizationId = session.organizationId;
    companies = await getRememberedCompanies(session);
  } catch {
    return <RetryState title="Relationship memory is unavailable" />;
  }
  return <MemoryDashboard key={organizationId} companies={companies} />;
}
