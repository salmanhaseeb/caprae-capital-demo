"use server";
import { cookies } from "next/headers";
import {
  encodeDemoSession,
  sessionForOrganization,
  SESSION_COOKIE,
} from "./demo-session";
export async function switchDemoOrganization(organizationId: string) {
  try {
    // Only these explicit demo identities are selectable. Never accept a user ID or arbitrary tenant.
    const session = sessionForOrganization(organizationId);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, encodeDemoSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 86_400,
    });
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error:
        "Could not switch demo identity. Check the demo session configuration.",
    };
  }
}
