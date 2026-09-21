"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CircleHelp,
  Command,
  History,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useDemo } from "./demo-provider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
export const navigation = [
  { label: "Search Leads", href: "/", icon: Search },
  { label: "Relationship Memory", href: "/memory", icon: History },
  { label: "Settings", href: "/settings", icon: Settings2 },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { organization } = useDemo();
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f5f7f5]">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-[77px] shrink-0 items-center px-6"
      >
        <Logo />
      </Link>
      <div className="px-4 pt-5">
        <div className="flex items-center gap-2 rounded-lg border border-[#e2e7e2] bg-white/70 p-2.5">
          <span className="flex size-8 items-center justify-center rounded-md border bg-white text-primary">
            <Command size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {organization.name}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Team workspace
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-3 pt-8 text-[11px] font-semibold tracking-[1.8px] text-[#6c786b]">
        WORKSPACE
      </div>
      <nav aria-label="Main navigation" className="space-y-1 px-3">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" || pathname.startsWith("/companies/") : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-[#e4eee7] text-[#286448]"
                  : "text-[#6b756f] hover:bg-[#ebefeb] hover:text-foreground",
              )}
            >
              <Icon size={17} strokeWidth={active ? 2 : 1.7} />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-4 pb-5 pt-12">
        <Dialog>
          <DialogTrigger className="mt-5 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-xs text-muted-foreground hover:text-foreground">
            <CircleHelp size={16} />
            Help & getting started
            <ArrowUpRight className="ml-auto" size={13} />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Using Search Memory</DialogTitle>
              <DialogDescription>
                Find companies, record conversations, and keep your team’s relationship context in one place.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3 text-sm leading-6 text-muted-foreground">
              <p>
                Use Search Leads to explore companies, filter by industry, and
                open a company&apos;s relationship history.
              </p>
              <p>
                Switch demo organizations in the header to see how the same
                company has different history for Acme Software and Beta
                Holdings.
              </p>
              <p>
                Use Log Interaction on a company page to save notes. AI identifies relationship context and next steps. If analysis is unavailable, your original notes are still saved.
              </p>
            </div>
          </DialogContent>
        </Dialog>
        <div className="mt-4 flex items-center gap-2 border-t pt-4 text-[11px] text-[#6c786b]">
          <ShieldCheck size={13} />
          <span>Private to your organization</span>
          <span className="ml-auto size-1.5 rounded-full bg-[#7bac8b]" />
        </div>
      </div>
    </div>
  );
}
