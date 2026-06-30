// Generic route-level loading skeleton shown during navigation/data fetches.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-surface-muted" />
        <div className="h-4 w-72 rounded-md bg-surface-muted/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-[var(--radius-card)] bg-surface-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[var(--radius-card)] bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
