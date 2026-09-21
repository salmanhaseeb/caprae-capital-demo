export default function Loading() {
  return <div role="status" aria-label="Loading relationship memory">
    <span className="sr-only">Loading relationship memory…</span>
    <div aria-hidden="true" className="animate-pulse">
      <div className="mb-3 h-9 w-64 rounded bg-muted" />
      <div className="mb-8 h-5 w-80 max-w-full rounded bg-muted" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-64 rounded-xl border bg-white p-5"><div className="h-6 w-40 rounded bg-muted" /><div className="mt-5 h-20 rounded bg-muted" /><div className="mt-6 h-9 rounded bg-muted" /></div>)}</div>
    </div>
  </div>;
}
