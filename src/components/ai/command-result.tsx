"use client";

import Link from "next/link";
import { Sparkles, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { CommandResult } from "@/server/ai/command-types";
import { UrgencyBadge } from "@/components/dashboard/urgency-badge";
import { formatAED } from "@/lib/utils";

export function CommandResultPanel({
  result,
  onClose,
}: {
  result: CommandResult;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-[var(--radius-card)] border border-border bg-surface shadow-lg">
      <div className="flex items-start gap-3 border-b border-border p-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-foreground">{result.message}</p>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-foreground-muted hover:bg-surface-muted"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-1.5">
        <ResultBody result={result} />
      </div>
    </div>
  );
}

function ResultBody({ result }: { result: CommandResult }) {
  switch (result.kind) {
    case "clients":
      return (
        <List>
          {result.clients.map((c) => (
            <Row key={c.id} href={`/clients/${c.id}`} title={c.name} subtitle={c.subtitle} />
          ))}
        </List>
      );

    case "properties":
      return (
        <List>
          {result.properties.map((p) => (
            <Row
              key={p.id}
              href={`/properties/${p.id}`}
              title={p.title}
              subtitle={[
                p.bedrooms ? `${p.bedrooms} bed` : null,
                p.area,
              ]
                .filter(Boolean)
                .join(" · ")}
              meta={formatAED(p.price)}
            />
          ))}
        </List>
      );

    case "conversations":
      return (
        <List>
          {result.conversations.map((c) => (
            <Row
              key={c.id}
              href={`/inbox?c=${c.id}`}
              title={c.name}
              subtitle={c.summary}
              badge={<UrgencyBadge level={c.urgency} />}
            />
          ))}
        </List>
      );

    case "events":
      return (
        <List>
          {result.events.map((e) => (
            <Row
              key={e.id}
              href={`/calendar/${e.id}/edit`}
              title={e.title}
              subtitle={e.type}
              meta={e.time}
            />
          ))}
        </List>
      );

    case "draft":
      return <DraftCard draft={result.draft} recipient={result.recipient} />;

    default:
      return null;
  }
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-border">{children}</ul>;
}

function Row({
  href,
  title,
  subtitle,
  meta,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{title}</span>
            {badge ?? (meta && (
              <span className="shrink-0 text-xs font-medium tabular-nums text-foreground-muted">
                {meta}
              </span>
            ))}
          </div>
          {subtitle && (
            <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
              {subtitle}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function DraftCard({
  draft,
  recipient,
}: {
  draft: string;
  recipient?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-2">
      {recipient && (
        <p className="mb-1 px-1 text-xs text-foreground-muted">To: {recipient}</p>
      )}
      <div className="rounded-lg bg-accent-muted p-3 text-sm text-foreground">
        {draft}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(draft);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <span className="text-xs text-foreground-muted">
          Review and paste this draft into the conversation before sending.
        </span>
      </div>
    </div>
  );
}
