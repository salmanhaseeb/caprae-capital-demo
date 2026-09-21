"use client";
import {
  Building2,
  CheckCheck,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useDemo } from "@/components/layout/demo-provider";
import { Input } from "@/components/ui/input";
import { PageHeading } from "./shared";
export function SettingsDashboard() {
  const { organization } = useDemo();
  return (
    <div className="page-enter max-w-5xl">
      <PageHeading
        title="Workspace settings"
        description="Organization details, team members, and access to relationship history."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="rounded-xl border bg-white">
            <div className="flex items-center gap-2 border-b px-6 py-5">
              <Building2 size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Workspace details</h2>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="org-name"
                  className="mb-2 block text-xs font-medium"
                >
                  Organization name
                </label>
                <Input
                  id="org-name"
                  value={organization.name}
                  readOnly
                  className="bg-[#fafbf9] text-sm"
                />
              </div>
              <p className="text-[12px] leading-5 text-muted-foreground">
                Workspace details are read-only in this demo. Switch organizations in
                the header to explore another organization.
              </p>
            </div>
          </section>
          <section className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Users size={16} className="text-muted-foreground" />
                Your team
              </h2>
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {organization.users.length} members
              </span>
            </div>
            <div className="divide-y px-6">
              {organization.users.map((user, index) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 py-5"
                >
                  <span className="flex size-9 items-center justify-center rounded-full border bg-[#eeeee4] text-xs text-[#6c786b]">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-xs font-medium">
                      {user.name}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <span className="ml-auto rounded border px-2 py-1 text-xs text-muted-foreground">
                    Member
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-xl border border-[#dfe8db] bg-[#f0f5ec] p-5">
          <span className="mb-4 flex size-10 items-center justify-center rounded-xl border border-[#dbe6d6] bg-white/70 text-[#6e8c60]">
            <LockKeyhole size={19} />
          </span>
          <h2 className="text-sm font-semibold text-[#536b46]">
            A private space for context.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6c786b]">
            Company profiles are shared. Notes, conversations, and relationship
            intelligence belong to your organization.
          </p>
          <div className="mt-5 space-y-3 border-t border-[#dce5d6] pt-4">
            {[
              "Organization-specific history",
              "Private interaction notes",
              "Shared company catalog",
            ].map((item) => (
              <p
                className="flex items-center gap-2 text-xs text-[#708463]"
                key={item}
              >
                <CheckCheck size={13} />
                {item}
              </p>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs text-[#6c786b]">
            <ShieldCheck size={12} />
            Organization-scoped access
          </p>
        </aside>
      </div>
    </div>
  );
}
