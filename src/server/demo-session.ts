import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { demoOrganizations, type DemoSession } from "@/lib/demo-identities";
export const SESSION_COOKIE = "search-memory-demo-session";
export class DemoSessionError extends Error {}
function secret() {
  const enabled =
    process.env.DEMO_MODE === "true" ||
    (process.env.DEMO_MODE === undefined &&
      process.env.NODE_ENV !== "production");
  if (!enabled)
    throw new DemoSessionError(
      "Enable DEMO_MODE to use the seeded demo identities. Production authentication is not connected yet.",
    );
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.DEMO_SESSION_SECRET ||
      process.env.DEMO_SESSION_SECRET.length < 32)
  )
    throw new DemoSessionError(
      "Set a DEMO_SESSION_SECRET of at least 32 characters for the deployed demo.",
    );
  return (
    process.env.DEMO_SESSION_SECRET || "search-memory-local-development-only"
  );
}
function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
export function sessionForOrganization(organizationId: string): DemoSession {
  secret();
  const organization = demoOrganizations.find(
    (item) => item.id === organizationId,
  );
  if (!organization) throw new DemoSessionError("Unknown demo identity.");
  return { organizationId: organization.id, userId: organization.users[0].id };
}
export function encodeDemoSession(session: DemoSession) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: session.userId,
      expiresAt: Date.now() + 7 * 86_400_000,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export async function getDemoSession(): Promise<DemoSession> {
  secret();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // The demo deliberately starts as Acme; this is not production authentication.
  if (!token) return sessionForOrganization(demoOrganizations[0].id);
  try {
    const parts = token.split(".");
    if (parts.length !== 2) throw new Error();
    const [payload, supplied] = parts;
    const expected = signature(payload);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      throw new Error();
    const value = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof value.expiresAt !== "number" || value.expiresAt < Date.now())
      throw new Error();
    const organization = demoOrganizations.find(
      (item) => item.users[0].id === value.userId,
    );
    if (!organization) throw new Error();
    return {
      userId: organization.users[0].id,
      organizationId: organization.id,
    };
  } catch {
    throw new DemoSessionError(
      "Your demo session expired or is invalid. Select a demo organization from the header to continue.",
    );
  }
}
