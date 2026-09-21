"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { History, ShieldCheck, X } from "lucide-react";
import type { LeadRow } from "@/lib/lead-search";
import { LeadRelationshipBadge } from "./relationship-badge";

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : null;
}

export function RelationshipMemoryBadge({ company, organizationName }: {
  company: LeadRow;
  organizationName: string;
}) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelClose = () => clearTimeout(timer.current);
  useEffect(() => () => clearTimeout(timer.current), []);
  function leave() {
    if (!pinned.current) timer.current = setTimeout(() => setOpen(false), 180);
  }
  return (
    <Popover.Root open={open} onOpenChange={(value) => {
      cancelClose();
      if (!value) pinned.current = false;
      setOpen(value);
    }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${company.relationship} — relationship memory for ${company.name}`}
          className="rounded-md outline-none transition-shadow hover:ring-2 hover:ring-primary/15 focus-visible:ring-2 focus-visible:ring-primary"
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            cancelClose();
            setOpen(true);
          }}
          onPointerLeave={leave}
          onClick={(event) => {
            // Clicking pins the hover preview until dismissed (also works on touch/keyboard).
            event.preventDefault();
            cancelClose();
            pinned.current = true;
            setOpen(true);
          }}
        >
          <LeadRelationshipBadge label={company.relationship} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label={`Relationship Memory for ${company.name}`}
          side="left"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={event => event.preventDefault()}
          onCloseAutoFocus={event => event.preventDefault()}
          onPointerEnter={cancelClose}
          onPointerLeave={leave}
          onFocusCapture={() => { cancelClose(); pinned.current = true; }}
          className="z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl border bg-white p-4 text-foreground shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><History size={16} className="text-primary" />Relationship Memory</h3>
            <Popover.Close aria-label="Close relationship memory" className="rounded p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><X size={14} /></Popover.Close>
          </div>
          <p className="mt-1 break-words text-xs text-muted-foreground">{company.name}</p>
          {!company.hasHistory && <p className="mt-4 text-xs leading-5">This company is a new lead for your organization.</p>}
          <dl className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div><dt className="text-muted-foreground">Last Contacted</dt><dd className="mt-1 font-medium">{date(company.lastContactedAt) ?? "No contact recorded"}</dd></div>
            <div><dt className="text-muted-foreground">Interaction Count</dt><dd className="mt-1 font-medium tabular-nums">{company.interactionCount}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Next Follow-up</dt><dd className="mt-1 font-medium">{date(company.nextFollowUpAt) ?? "Not scheduled"}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Recommended Next Action</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-5">{company.recommendedAction ?? "No next action recorded."}</dd></div>
          </dl>
          <p className="mt-4 flex items-center gap-1.5 border-t pt-3 text-[10px] text-muted-foreground"><ShieldCheck size={12} />Private to {organizationName} · Dates in UTC</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
