export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading company details"
      className="space-y-6"
    >
      <p className="text-sm text-muted-foreground">Loading company details…</p>
      <div aria-hidden="true" className="animate-pulse space-y-6">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl border bg-white" />
        <div className="h-80 rounded-xl border bg-white" />
      </div>
    </div>
  );
}
