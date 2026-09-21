"use client";
import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demoOrganizations } from "@/lib/demo-identities";
import { switchDemoOrganization } from "@/server/session-actions";
const DemoContext = createContext<{
  organization: (typeof demoOrganizations)[number];
  setOrganizationId: (id: string) => void;
  isSwitching: boolean;
} | null>(null);
export function DemoProvider({
  children,
  organizationId,
}: {
  children: React.ReactNode;
  organizationId: string;
}) {
  const [isSwitching, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const organization =
    demoOrganizations.find((item) => item.id === organizationId) ??
    demoOrganizations[0];
  function setOrganizationId(id: string) {
    setError("");
    startTransition(async () => {
      try {
      const result = await switchDemoOrganization(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      } catch { setError("Workspace could not be switched. Please try again."); }
    });
  }
  return (
    <DemoContext.Provider
      value={{ organization, setOrganizationId, isSwitching }}
    >
      {isSwitching && (
        <div
          role="status"
          className="fixed left-1/2 top-2 z-[100] -translate-x-1/2 rounded-lg border bg-white px-4 py-2 text-xs shadow"
        >
          Switching workspace…
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-lg border border-red-200 bg-white p-4 text-xs text-red-700"
        >
          {error}
          <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
        </div>
      )}
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
