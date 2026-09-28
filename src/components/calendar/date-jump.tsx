"use client";
import { useRouter } from "next/navigation";
export function DateJump({ view, date }: { view: string; date: string }) {
  const router = useRouter();
  return <input type="date" aria-label="Jump to date" value={date} onChange={e => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) router.push(`/calendar?view=${view}&date=${e.target.value}`); }} className="max-w-40 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm" />;
}
