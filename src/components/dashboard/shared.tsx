import {
  ArrowUpRight,
  Building2,
  Layers3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold tracking-[1.5px] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[29px] font-semibold leading-tight sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2.5 text-[13px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
export function CompanyMark({
  company,
  large = false,
}: {
  company: { name: string };
  large?: boolean;
}) {
  const index = Array.from(company.name).reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  const companyColors = [
    "bg-[#eceafb] text-[#7661ac]",
    "bg-[#e7f0f7] text-[#4d7c9e]",
    "bg-[#faeee5] text-[#b17e53]",
    "bg-[#e4efed] text-[#4c847d]",
  ];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-semibold",
        large ? "size-14 rounded-xl text-xl" : "size-9 text-sm",
        companyColors[index % companyColors.length],
      )}
    >
      {index % 3 === 0 ? (
        <Layers3 size={large ? 26 : 18} strokeWidth={1.8} />
      ) : index % 3 === 1 ? (
        <Building2 size={large ? 26 : 18} strokeWidth={1.8} />
      ) : (
        company.name[0]
      )}
    </span>
  );
}
export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  children,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="subtle-shadow rounded-xl border bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#7b847e]">{label}</span>
        <Icon
          size={15}
          className={accent ? "text-[#5c8f72]" : "text-[#6c786b]"}
          strokeWidth={1.7}
        />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="font-display text-[28px] font-semibold leading-none">
          {value}
        </span>
        {children ?? <ArrowUpRight size={16} className="mb-1 text-[#bdc8bf]" />}
      </div>
      <p className="mt-3 text-[11px] text-[#6c786b]">{detail}</p>
    </div>
  );
}
