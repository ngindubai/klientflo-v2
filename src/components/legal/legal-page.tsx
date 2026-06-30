import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const LAST_UPDATED = "30 June 2026";

/** Shared shell for the public legal pages (privacy, terms). */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
          K
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Last updated {LAST_UPDATED}
      </p>

      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        <strong>Template notice:</strong> this is a starting-point document, not
        legal advice. Have it reviewed and adapted by qualified counsel
        (including UAE PDPL specifics) before relying on it in production.
      </div>

      <article className="legal mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        {children}
      </article>

      <footer className="mt-12 flex gap-4 border-t border-border pt-6 text-xs text-foreground-muted">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms of Service
        </Link>
      </footer>
    </main>
  );
}

/** Section heading + body helper for consistent spacing. */
export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{heading}</h2>
      <div className="space-y-2 text-foreground-muted">{children}</div>
    </section>
  );
}
