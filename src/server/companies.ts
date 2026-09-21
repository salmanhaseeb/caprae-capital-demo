import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DemoSession } from "@/lib/demo-identities";
import {
  PAGE_SIZE,
  relationshipLabel,
  type SearchFilters,
  type SearchResult,
} from "@/lib/lead-search";
export { TenantAccessError } from "./tenant";
import { inOrganization } from "./tenant";
export function searchCompanies(
  session: DemoSession,
  filters: SearchFilters,
  requestedPage: number,
): Promise<SearchResult> {
  return inOrganization(session, async (tx) => {
    const where: Prisma.CompanyWhereInput = {
      ...(filters.industry
        ? { industry: { equals: filters.industry, mode: "insensitive" } }
        : {}),
      ...(filters.location
        ? { location: { contains: filters.location, mode: "insensitive" } }
        : {}),
      ...(filters.minEmployees || filters.maxEmployees
        ? {
            employeeCount: {
              ...(filters.minEmployees
                ? { gte: Number(filters.minEmployees) }
                : {}),
              ...(filters.maxEmployees
                ? { lte: Number(filters.maxEmployees) }
                : {}),
            },
          }
        : {}),
      ...(filters.minRevenue || filters.maxRevenue
        ? {
            estimatedRevenue: {
              ...(filters.minRevenue ? { gte: filters.minRevenue } : {}),
              ...(filters.maxRevenue ? { lte: filters.maxRevenue } : {}),
            },
          }
        : {}),
    };
    const total = await tx.company.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);
    const rows = await tx.company.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        location: true,
        employeeCount: true,
        estimatedRevenue: true,
        ceoName: true,
        _count: { select: { interactions: { where: { organizationId: session.organizationId } } } },
        interactions: {
          where: { organizationId: session.organizationId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: {
            recommendedAction: true,
            relationshipStatus: true,
            sellerReadiness: true,
            nextFollowUpAt: true,
          },
        },
      },
    });
    // A separate bounded query preserves explicit suppression even after a later note.
    const suppressed = await tx.interaction.findMany({
      where: {
        organizationId: session.organizationId,
        companyId: { in: rows.map((row) => row.id) },
        relationshipStatus: "DO_NOT_CONTACT",
      },
      distinct: ["companyId"],
      select: { companyId: true },
    });
    const suppressions = new Set(suppressed.map((row) => row.companyId));
    // Aggregate only this result page and this tenant; internal notes are not contact.
    const contacts = await tx.interaction.groupBy({
      by: ["companyId"],
      where: {
        organizationId: session.organizationId,
        companyId: { in: rows.map(row => row.id) },
        interactionType: { not: "NOTE" },
      },
      _max: { createdAt: true },
    });
    const lastContacts = new Map(contacts.map(row => [row.companyId, row._max.createdAt]));
    const industryRows = await tx.company.findMany({
      where: { industry: { not: null } },
      distinct: ["industry"],
      select: { industry: true },
      orderBy: { industry: "asc" },
    });
    const locationRows = await tx.company.findMany({
      where: { location: { not: null } },
      distinct: ["location"],
      select: { location: true },
      orderBy: { location: "asc" },
    });
    return {
      total,
      page,
      totalPages,
      industries: industryRows.map((row) => row.industry!).filter(Boolean),
      locations: locationRows.map((row) => row.location!).filter(Boolean),
      companies: rows.map(({ interactions, estimatedRevenue, _count, ...company }) => {
        const latest = interactions[0];
        const isSuppressed = suppressions.has(company.id);
        const relationship = relationshipLabel(latest, isSuppressed);
        const statuses = {
          New: "NEW", "Previously Contacted": "COLD", Warm: "WARM",
          "Follow Up": "FOLLOW_UP", Interested: "INTERESTED", "Do Not Contact": "DO_NOT_CONTACT",
        } as const;
        return {
          ...company,
          estimatedRevenue: estimatedRevenue?.toString() ?? null,
          relationship,
          hasHistory: _count.interactions > 0,
          relationshipStatus: statuses[relationship],
          lastContactedAt: lastContacts.get(company.id)?.toISOString() ?? null,
          nextFollowUpAt: isSuppressed ? null : latest?.nextFollowUpAt?.toISOString() ?? null,
          interactionCount: _count.interactions,
          recommendedAction: isSuppressed
            ? "Do not contact. Outreach is suppressed for this organization."
            : latest?.recommendedAction ?? null,
        };
      }),
    };
  });
}
export function getCompanyDetails(session: DemoSession, id: string) {
  return inOrganization(session, async (tx) => {
    const company = await tx.company.findUnique({
      where: { id },
      include: {
        interactions: {
          where: { organizationId: session.organizationId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!company) return null;
    return {
      ...company,
      relationship: relationshipLabel(
        company.interactions[0],
        company.interactions.some(
          (item) => item.relationshipStatus === "DO_NOT_CONTACT",
        ),
      ),
    };
  });
}

export function getRememberedCompanies(session: DemoSession) {
  return inOrganization(session, async (tx) => {
    const rows = await tx.company.findMany({
      where: {
        interactions: { some: { organizationId: session.organizationId } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        industry: true,
        location: true,
        interactions: {
          where: { organizationId: session.organizationId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            aiSummary: true,
            createdAt: true,
            nextFollowUpAt: true,
            relationshipStatus: true,
            sellerReadiness: true,
          },
        },
      },
    });
    return rows.map(({ interactions, ...company }) => ({
      ...company,
      relationship: relationshipLabel(
        interactions[0],
        interactions.some(
          (entry) => entry.relationshipStatus === "DO_NOT_CONTACT",
        ),
      ),
      summary:
        interactions[0]?.aiSummary ??
        "An interaction is recorded. Open the company to review the original notes.",
      interactionCount: interactions.length,
      lastInteractionAt: interactions[0].createdAt.toISOString(),
    }));
  });
}
