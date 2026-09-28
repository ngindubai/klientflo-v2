import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Prev/Next pager driven by URL ?page=. Renders nothing when everything fits on
 * one page. Extra query params (e.g. search) are preserved across pages.
 */
export function Pager({
  page,
  pageSize,
  total,
  basePath,
  query,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: Record<string, string>;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(query);
    params.delete("page");
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkClass =
    "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-surface-muted";
  const disabled = "pointer-events-none opacity-40";

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <Link href={href(page - 1)} className={`${linkClass} ${page <= 1 ? disabled : ""}`}>
        <ChevronLeft className="size-4" /> Previous
      </Link>
      <span className="text-xs text-foreground-muted">
        Page {page} of {pages} · {total} total
      </span>
      <Link
        href={href(page + 1)}
        className={`${linkClass} ${page >= pages ? disabled : ""}`}
      >
        Next <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
