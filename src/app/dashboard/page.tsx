import Link from "next/link";

// Placeholder — the full operational dashboard arrives in Chunk 4 (Phase B),
// once the app shell, navigation, and global AI command bar are in place.
export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-foreground-muted">
          The operational hub is coming in Chunk 4. Foundation is in place.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[var(--radius-card)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}
