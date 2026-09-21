import { Toaster } from "sonner";
import type { Metadata } from "next";
import { getDemoSession } from "@/server/demo-session";
export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import "@fontsource-variable/inter";
import "./globals.css";
export const metadata: Metadata = {
  title: "Search Memory — A little more context",
  description:
    "Discover the right companies. Remember every relationship. An organization-aware B2B lead intelligence workspace.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getDemoSession().catch(() => null);
  return (
    <html lang="en">
      <body>
        <AppShell organizationId={session?.organizationId ?? "demo-org-acme"}>
          {children}
        </AppShell>
        <Toaster richColors closeButton position="bottom-right" duration={5500} visibleToasts={3} toastOptions={{ style: { fontFamily: "var(--font-sans)", fontSize: "14px" } }} />
      </body>
    </html>
  );
}
