export function SearchLoading({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div>
      {fullPage && <div aria-hidden="true" className="mb-6 animate-pulse space-y-5"><div className="h-9 w-64 rounded bg-muted" /><div className="h-5 w-80 max-w-full rounded bg-muted" /><div className="h-64 rounded-xl border bg-white" /></div>}
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading companies"
      className="rounded-xl border bg-white p-6"
    >
      <p className="mb-6 text-sm font-medium text-primary">
        Searching companies…
      </p>
      <div aria-hidden="true" className="animate-pulse space-y-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="flex gap-5" key={i}>
            <span className="size-10 rounded-lg bg-muted" />
            <span className="h-10 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
