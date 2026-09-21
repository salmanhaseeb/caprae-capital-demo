"use client";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useDemo } from "./demo-provider";
import { navigation } from "./sidebar";
import { demoOrganizations as organizations } from "@/lib/demo-identities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./logo";
export function Header({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const { organization, setOrganizationId, isSwitching } = useDemo();
  const title =
    navigation.find((item) => item.href === path)?.label ?? "Company details";
  const user = organization.users[0];
  return (
    <header className="flex h-[77px] shrink-0 items-center justify-between gap-3 border-b bg-white px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:block">
          Workspace
        </span>
        <ChevronRight className="hidden text-[#b0b8b2] sm:block" size={13} />
        <span className="hidden text-sm font-medium sm:block">{title}</span>
        <span className="sm:hidden">
          <Logo small />
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={organization.name}
            disabled={isSwitching}
            className="hidden items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium sm:flex"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-[#edf1ec] text-[11px] text-[#66805c]">
              {organization.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </span>
            {organization.name}
            <ChevronDown size={12} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                disabled={isSwitching}
                onClick={() => setOrganizationId(org.id)}
              >
                {org.name}
                {organization.id === org.id && (
                  <Check className="ml-auto" size={14} />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <p className="px-2 py-2 text-xs leading-5 text-muted-foreground">
              Fictional demo identities. Each organization has its own history.
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Account menu for ${user.name}`} className="flex min-h-11 items-center gap-2.5 rounded-full">
            <span className="flex size-8 items-center justify-center rounded-full border border-[#dfdccf] bg-[#eee9dd] text-[12px] font-medium text-[#6c786b]">
              {user.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
            <span className="hidden text-left xl:block">
              <span className="block text-xs font-medium">{user.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                Team member
              </span>
            </span>
            <ChevronDown
              className="hidden text-muted-foreground xl:block"
              size={12}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              {user.email}
            </p>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch organization
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                disabled={isSwitching}
                onClick={() => setOrganizationId(org.id)}
              >
                {org.name}
                {org.id === organization.id && (
                  <Check className="ml-auto" size={14} />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
