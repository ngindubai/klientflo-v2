"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CONVERSATION_CLASSIFICATIONS, CONTACT_CATEGORIES, CONTACT_CATEGORY_LABELS, humanizeEnum } from "@/lib/constants";
const selectClass = "min-w-0 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs focus:border-primary";
export function InboxFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const priority = params.get("priority") ?? "";
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    router.push(`/inbox?${next}`);
  }
  return <div className="shrink-0 space-y-2 border-b border-border p-3">
    <form className="flex gap-1.5" onSubmit={e => { e.preventDefault(); update("q", String(new FormData(e.currentTarget).get("q") ?? "")); }}>
      <div className="relative min-w-0 flex-1"><Search className="absolute top-2.5 left-2.5 size-3.5 text-foreground-muted" /><input key={params.get("q")} name="q" aria-label="Search conversations" defaultValue={params.get("q") ?? ""} placeholder="Search name, message, phone…" className="w-full rounded-lg border border-border bg-surface py-2 pr-2 pl-8 text-xs" /></div>
      <button className="rounded-lg border border-border px-2 text-xs font-medium hover:bg-surface-muted">Go</button>
    </form>
    <div className="grid grid-cols-2 gap-2">
      <select aria-label="Priority" className={selectClass} value={priority} onChange={e => update("priority", e.target.value)}><option value="">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option>{/^[1-5]$/.test(priority) && <option value={priority}>Urgency {priority}+</option>}</select>
      <select aria-label="Contact tag" className={selectClass} value={params.get("tag") ?? ""} onChange={e => update("tag", e.target.value)}><option value="">All tags</option>{CONTACT_CATEGORIES.map(c => <option key={c} value={c}>{CONTACT_CATEGORY_LABELS[c]}</option>)}</select>
      <select aria-label="Conversation status" className={selectClass} value={params.get("status") ?? ""} onChange={e => update("status", e.target.value)}><option value="">All conversations</option><option value="pending">Needs a reply</option><option value="handled">Handled</option><option value="drafts">AI drafts</option><option value="voice">Voice to review</option></select>
      <select aria-label="Sort conversations" className={selectClass} value={params.get("sort") ?? ""} onChange={e => update("sort", e.target.value)}><option value="">Priority first</option><option value="newest">Newest first</option></select>
    </div>
    <details className="text-xs text-foreground-muted"><summary className="cursor-pointer">More filters{params.get("category") ? " · 1 active" : ""}</summary><select aria-label="Conversation classification" className={`${selectClass} mt-2`} value={params.get("category") ?? ""} onChange={e => update("category", e.target.value)}><option value="">All classifications</option>{CONVERSATION_CLASSIFICATIONS.map(c => <option key={c} value={c}>{humanizeEnum(c)}</option>)}</select><button onClick={() => router.push(`/inbox${params.get("c") ? `?c=${encodeURIComponent(params.get("c")!)}` : ""}`)} className="mt-2 py-1 text-primary hover:underline">Clear filters</button></details>
  </div>;
}
