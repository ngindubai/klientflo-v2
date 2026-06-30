import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { APP_TAGLINE } from "@/lib/constants";

const HIGHLIGHTS = [
  "Monitors every WhatsApp conversation and flags what's urgent",
  "Transcribes voice notes and extracts what each client wants",
  "Recommends matching properties and drafts replies for you",
  "Run almost everything from one dashboard — by voice or command",
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <BrandLogo size="lg" className="mb-8" />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-muted px-3 py-1 text-sm font-medium text-primary">
          <span className="size-2 rounded-full bg-accent" />
          WhatsApp-first · AI-powered · Built for UAE real estate
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Client workflows, simplified.
        </h1>
        <p className="mt-4 text-lg text-foreground-muted">
          Your AI real estate assistant — not another CRM. It watches your
          WhatsApp, spots hot buyers, books viewings, and handles the admin so
          you can sell.
        </p>

        <ul className="mt-8 space-y-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                ✓
              </span>
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-[var(--radius-card)] bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-[var(--radius-card)] border border-border px-5 py-3 font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-10 text-xs text-foreground-muted">{APP_TAGLINE}</p>
      </div>
    </main>
  );
}
