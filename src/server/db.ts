import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
export class DatabaseConfigurationError extends Error {}
const globalDb = globalThis as unknown as { searchMemoryPrisma?: PrismaClient };
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new DatabaseConfigurationError(
      "Configure DATABASE_URL, apply the migrations, and seed the demo database to search companies.",
    );
  if (!globalDb.searchMemoryPrisma)
    globalDb.searchMemoryPrisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 20_000,
      }),
    });
  return globalDb.searchMemoryPrisma;
}
