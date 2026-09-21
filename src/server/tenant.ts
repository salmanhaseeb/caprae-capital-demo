import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DemoSession } from "@/lib/demo-identities";
import { getDb } from "./db";
export class TenantAccessError extends Error {}
export async function inOrganization<T>(
  session: DemoSession,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return getDb().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.organization_id', ${session.organizationId}, true)`;
      const user = await tx.user.findUnique({
        where: {
          organizationId_id: {
            organizationId: session.organizationId,
            id: session.userId,
          },
        },
        select: { id: true },
      });
      if (!user)
        throw new TenantAccessError(
          "The current demo user is unavailable in this organization. Apply the demo seed and try again.",
        );
      return operation(tx);
    },
    { maxWait: 5_000, timeout: 15_000, isolationLevel: "RepeatableRead" },
  );
}
