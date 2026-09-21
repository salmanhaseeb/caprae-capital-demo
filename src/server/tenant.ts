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
      // Apply on the transaction's connection, not startup parameters that a
      // serverless proxy/pooler may ignore. LOCAL settings reset at transaction end.
      await tx.$executeRaw`SET LOCAL statement_timeout = '15s'`;
      await tx.$executeRaw`SET LOCAL idle_in_transaction_session_timeout = '20s'`;
      const [role] = await tx.$queryRaw<{ unsafe: boolean }[]>`SELECT EXISTS (
        SELECT 1 FROM pg_roles
        WHERE (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolname = 'neon_superuser')
          AND pg_has_role(current_user, oid, 'MEMBER')
      ) OR EXISTS (
        SELECT 1 FROM pg_class WHERE relnamespace = 'public'::regnamespace
          AND relname IN ('Organization', 'User', 'Interaction')
          AND pg_has_role(current_user, relowner, 'MEMBER')
      ) AS unsafe`;
      if (role?.unsafe) throw new TenantAccessError("The database access configuration is unavailable. Contact the workspace administrator.");
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
