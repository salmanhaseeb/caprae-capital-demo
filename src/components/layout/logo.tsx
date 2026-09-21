import { cn } from "@/lib/utils";
export function Logo({
  className,
  small = false,
}: {
  className?: string;
  small?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#286b52] text-white",
          small ? "size-7" : "size-8",
        )}
      >
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 8.4 12 4l7 4.4-7 4.4L5 8.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="m5 12 7 4.4 7-4.4M5 15.8l7 4.3 7-4.3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-[17px] font-semibold tracking-[-0.6px]">
        Search Memory<span className="ml-0.5 text-primary">.</span>
      </span>
    </span>
  );
}
