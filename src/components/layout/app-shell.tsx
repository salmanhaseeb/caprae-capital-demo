"use client";
import { useState } from "react";
import { DemoProvider } from "./demo-provider";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
export function AppShell({
  children,
  organizationId,
}: {
  children: React.ReactNode;
  organizationId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <DemoProvider organizationId={organizationId}>
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r lg:block">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[232px]">
          <Header onMenu={() => setMenuOpen(true)} />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-8 sm:py-9 lg:px-9"
          >
            {children}
          </main>
          <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-5 text-[11px] text-[#6c786b] sm:px-9">
            <span>Built for better conversations.</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#8bad8d]" />
              Fictional demo data<span className="mx-1">·</span>Search Memory ©
              2026
            </span>
          </footer>
        </div>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[260px] gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Search Memory workspace navigation
            </SheetDescription>
          </SheetHeader>
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </DemoProvider>
  );
}
