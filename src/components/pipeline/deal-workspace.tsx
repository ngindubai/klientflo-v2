"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Circle, Plus, X } from "lucide-react";
import { humanizeEnum } from "@/lib/constants";
import { dealStages, type TaskInput } from "@/lib/deal-workflow";
import { formatAED, cn } from "@/lib/utils";
import { WORKSPACE_TIME_ZONE } from "@/lib/dubai-time";
import type { DealWorkspaceData } from "@/server/deal-workspace";
import { addSuggestedDealTasks, saveDealNotes, saveDealTask, setDealStage, setDealTaskStatus } from "@/server/deal-actions";

type Task = DealWorkspaceData["tasks"][number];
const inputClass = "min-w-0 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-50";
const primaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50";

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: WORKSPACE_TIME_ZONE });
}

export function DealDrawer({ deal, returnHref }: { deal: DealWorkspaceData | null; returnHref: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} className="kf-deal-drawer" onCancel={e => { e.preventDefault(); router.replace(returnHref, { scroll: false }); }}>
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <h2 id={titleId} className="font-semibold">Deal details</h2>
      <div className="flex items-center gap-2">
        {deal && <Link href={`/deals/${deal.id}`} className={buttonClass}>Full page <ArrowUpRight className="size-4" /></Link>}
        <button autoFocus type="button" onClick={() => router.replace(returnHref, { scroll: false })} aria-label="Close deal details" className={buttonClass}><X className="size-5" /></button>
      </div>
    </header>
    <div className="p-4 sm:p-6">{deal ? <DealWorkspace key={deal.id} deal={deal} /> : <p role="alert">This deal could not be found. Close this panel to return to your deals.</p>}</div>
  </dialog>;
}

export function DealWorkspace({ deal, fullPage = false }: { deal: DealWorkspaceData; fullPage?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Task | "new" | null>(null);
  const [filter, setFilter] = useState("all");
  const stages = dealStages(deal.type);
  const activeStages = stages.filter(s => !s.startsWith("closed_"));
  const stageIndex = activeStages.indexOf(deal.stage);
  const closed = deal.stage.startsWith("closed_");
  const open = deal.tasks.filter(t => t.status === "pending");
  const overdue = open.filter(t => t.dueDate && t.dueDate < deal.today);
  const blocked = open.filter(t => t.blocked);
  const visible = open.filter(t => filter === "all" || !t.stage || t.stage === deal.stage)
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || Number(b.blocked) - Number(a.blocked) || stages.indexOf(a.stage ?? deal.stage) - stages.indexOf(b.stage ?? deal.stage));
  const later = (t: Task) => !t.dueDate && !t.blocked && t.stage !== null && stageIndex >= 0 && stages.indexOf(t.stage) > stageIndex;
  const groups = [
    { title: "Overdue", tasks: visible.filter(t => t.dueDate && t.dueDate < deal.today), danger: true },
    { title: "Due today", tasks: visible.filter(t => t.dueDate === deal.today) },
    { title: "Blocked without a date", tasks: visible.filter(t => !t.dueDate && t.blocked), danger: true },
    { title: "Upcoming", tasks: visible.filter(t => t.dueDate && t.dueDate > deal.today) },
    { title: "No due date", tasks: visible.filter(t => !t.dueDate && !t.blocked && !later(t)) },
  ];
  const laterTasks = visible.filter(later);
  const archived = deal.tasks.filter(t => t.status !== "pending");
  const nextStage = stageIndex >= 0 ? activeStages[stageIndex + 1] : undefined;
  const linkedDocuments = deal.documents.filter(d => d.dealId === deal.id);
  const sharedDocuments = deal.documents.filter(d => !d.dealId);
  const upcomingEvents = deal.events.filter(e => e.endsAt >= deal.now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  function run(action: () => Promise<unknown>, success: string, after?: () => void) {
    setError(""); setNotice("");
    startTransition(async () => {
      try { await action(); setNotice(success); after?.(); }
      catch (err) { setError(err instanceof Error ? err.message : "Could not save. Please try again."); }
    });
  }

  function taskRow(task: Task) {
    return <li key={task.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
      <button type="button" disabled={pending} aria-label={`${task.status === "done" ? "Reopen" : "Complete"} task: ${task.title}`} onClick={() => run(() => setDealTaskStatus(deal.id, task.id, task.status === "done" ? "pending" : "done"), task.status === "done" ? "Task reopened." : "Task completed.")} className="-ml-1 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-muted disabled:opacity-50">
        {task.status === "done" ? <Check className="size-5" /> : <Circle className="size-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("break-words text-sm font-medium", task.status !== "pending" && "text-foreground-muted")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground-muted">
          <span>{task.assignee || "Unassigned"}</span>
          {task.dueDate && <span className={task.status === "pending" && task.dueDate < deal.today ? "font-medium text-urgency-5" : ""}>{dateLabel(task.dueDate)}</span>}
          {task.stage && <span>{humanizeEnum(task.stage)}</span>}
          {task.blocked && task.status === "pending" && <span className="font-semibold text-urgency-5">Blocked</span>}
          {task.status === "dismissed" && <span>Dismissed</span>}
        </div>
        {task.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-foreground-muted">{task.notes}</p>}
        <div className="mt-1 flex flex-wrap gap-1">
          <button type="button" disabled={pending} className="min-h-9 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary-muted" onClick={() => setEditor(task)}>Edit task</button>
          {task.status === "pending" ? <button type="button" disabled={pending} className="min-h-9 rounded-md px-2 text-xs text-foreground-muted hover:bg-surface-muted" onClick={() => run(() => setDealTaskStatus(deal.id, task.id, "dismissed"), "Task dismissed. You can reopen it below.")}>Dismiss</button>
            : <button type="button" disabled={pending} className="min-h-9 rounded-md px-2 text-xs text-primary hover:bg-primary-muted" onClick={() => run(() => setDealTaskStatus(deal.id, task.id, "pending"), "Task reopened.")}>Reopen task</button>}
        </div>
      </div>
    </li>;
  }

  function documentRows(documents: DealWorkspaceData["documents"]) {
    return <ul className="space-y-2">{documents.map(doc => <li key={doc.id} className="rounded-lg border border-border p-3 text-sm">
      {doc.fileUrl ? <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="break-words font-medium text-primary hover:underline">{doc.name} ↗</a> : <span className="break-words">{doc.name} · File not uploaded</span>}
      <p className="mt-1 text-xs text-foreground-muted">{humanizeEnum(doc.type)}{doc.expiresAt && ` · ${doc.expiresAt < deal.today ? "Expired" : "Expires"} ${dateLabel(doc.expiresAt)}`}</p>
    </li>)}</ul>;
  }

  return <div className="mx-auto min-w-0 max-w-6xl space-y-5">
    {fullPage && <div className="flex flex-wrap gap-2"><Link href="/opportunities" className={buttonClass}><ArrowLeft className="size-4" /> All deals</Link><Link href={`/pipeline?type=${deal.type}`} className={buttonClass}>{deal.type === "sale" ? "Sales" : "Rental"} board</Link></div>}
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{deal.type === "sale" ? "Sales" : "Rental"} deal</p>
      <h1 className="break-words text-2xl font-semibold tracking-tight">{deal.client?.name ?? "Unassigned client"}</h1>
      <p className="mt-1 break-words text-sm text-foreground-muted">{deal.property?.title ?? "No property linked"}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm"><span className="font-semibold">{deal.amount != null ? formatAED(deal.amount) : "Value not set"}</span><span className="text-foreground-muted">Managed by {deal.owner}</span></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {deal.client && <Link href={`/clients/${deal.client.id}`} className={`${buttonClass} !px-2 !text-xs`}>Client profile</Link>}
        {deal.property && <Link href={`/properties/${deal.property.id}`} className={`${buttonClass} !px-2 !text-xs`}>Property</Link>}
        {deal.conversations[0] && <Link href={`/inbox?c=${deal.conversations[0].id}`} className={`${buttonClass} !px-2 !text-xs`}>Client conversations</Link>}
      </div>
      <a href={`#deal-tasks-${deal.id}`} className="mt-3 inline-flex min-h-9 flex-wrap items-center gap-2 text-sm font-medium text-primary">{open.length} outstanding tasks{overdue.length > 0 && <span className="text-urgency-5">· {overdue.length} overdue</span>}{blocked.length > 0 && <span className="text-urgency-5">· {blocked.length} blocked</span>} <ChevronRight className="size-4" /></a>
    </section>

    <section className="rounded-xl border border-border bg-surface p-4" aria-label="Deal pipeline progress">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-sm font-semibold">Pipeline progress</h2><p className="mt-1 text-xs text-foreground-muted">{closed ? humanizeEnum(deal.stage) : `Stage ${stageIndex + 1} of ${activeStages.length}`}{nextStage ? ` · Next: ${humanizeEnum(nextStage)}` : ""}</p></div>
        <label className="w-full text-xs font-medium sm:max-w-64">Current stage<select aria-label="Current deal stage" disabled={pending} value={deal.stage} onChange={e => run(() => setDealStage(deal.id, e.target.value), "Stage updated. Outstanding tasks are unchanged.")} className={`${inputClass} mt-1`}>{stages.map(s => <option key={s} value={s}>{humanizeEnum(s)}</option>)}</select></label>
      </div>
      <div className="mt-4 flex gap-1" aria-hidden="true">{activeStages.map((s, i) => <span key={s} className={cn("h-1.5 min-w-0 flex-1 rounded-full", s === deal.stage ? "bg-primary" : i < stageIndex || deal.stage === "closed_won" ? "bg-primary/30" : "bg-surface-muted")} />)}</div>
      <details className="mt-3"><summary className="cursor-pointer py-1 text-xs font-medium text-primary">View all {deal.type === "sale" ? "sales" : "rental"} stages</summary><ol className="mt-3 grid gap-2 sm:grid-cols-2">{activeStages.map((s, i) => <li key={s} aria-current={s === deal.stage ? "step" : undefined} className={cn("flex items-center gap-2 rounded-lg p-2 text-xs", s === deal.stage ? "bg-primary-muted font-semibold text-primary" : "text-foreground-muted")}><span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>{humanizeEnum(s)}{s === deal.stage && <ChevronRight className="ml-auto size-4 shrink-0" />}</li>)}</ol><p className="mt-2 text-xs text-foreground-muted">Pipeline position does not mark tasks as completed.</p></details>
    </section>

    <div role="status" aria-live="polite" className={notice || pending ? "rounded-lg bg-primary-muted px-3 py-2 text-sm text-primary" : "sr-only"}>{pending ? "Saving changes…" : notice}</div>
    {error && <p role="alert" className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">{error}</p>}

    <div className={cn("grid min-w-0 gap-5", fullPage && "xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
      <section id={`deal-tasks-${deal.id}`} className="min-w-0 scroll-mt-24 space-y-4" aria-label="Deal tasks">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Outstanding tasks <span className="text-foreground-muted">{open.length}</span></h2><p className="mt-1 text-xs text-foreground-muted">{overdue.length} overdue · {blocked.length} blocked · Due dates use Dubai time</p></div><button type="button" className={primaryClass} disabled={pending} onClick={() => setEditor("new")}><Plus className="size-4" /> Add task</button></div>
        {closed && open.length > 0 && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">This deal is closed with {open.length} outstanding tasks. Review, complete or dismiss them as appropriate.</p>}
        {editor && <TaskEditor key={editor === "new" ? "new" : editor.id} task={editor === "new" ? null : editor} deal={deal} pending={pending} onCancel={() => setEditor(null)} onSave={input => run(() => saveDealTask(deal.id, editor === "new" ? null : editor.id, input), "Task saved.", () => setEditor(null))} />}
        <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor={`task-filter-${deal.id}`}>Task filter</label><select id={`task-filter-${deal.id}`} value={filter} onChange={e => setFilter(e.target.value)} className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm"><option value="all">All outstanding tasks</option><option value="current">Current stage + general</option></select>
          {!closed && <button type="button" disabled={pending} className={buttonClass} onClick={() => { setError(""); setNotice(""); startTransition(async () => { try { const count = await addSuggestedDealTasks(deal.id); setNotice(count ? `${count} suggested tasks added. Review the wording, owners and dates.` : "The suggested tasks for these stages are already present, including any dismissed tasks."); } catch (err) { setError(err instanceof Error ? err.message : "Could not add tasks."); } }); }}>Add suggested checklist</button>}
        </div>
        {open.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-foreground-muted">No outstanding tasks. Add a task{!closed ? " or start with the suggested checklist for this stage and the stages ahead" : ""}.</p>}
        {open.length > 0 && visible.length === 0 && <p className="text-sm text-foreground-muted">No outstanding tasks for this stage. Select “All outstanding tasks” to see the rest.</p>}
        {groups.map(g => g.tasks.length > 0 && <div key={g.title}><h3 className={cn("mb-2 text-xs font-semibold", g.danger ? "text-urgency-5" : "text-foreground-muted")}>{g.title} · {g.tasks.length}</h3><ul className="space-y-2">{g.tasks.map(taskRow)}</ul></div>)}
        {laterTasks.length > 0 && <details><summary className="cursor-pointer py-2 text-sm font-medium">Later stages · {laterTasks.length} tasks without dates</summary><ul className="mt-2 space-y-2">{laterTasks.map(taskRow)}</ul></details>}
        {archived.length > 0 && <details><summary className="cursor-pointer py-2 text-sm text-foreground-muted">Completed and dismissed · {archived.length}</summary><ul className="mt-2 space-y-2">{archived.map(taskRow)}</ul></details>}
      </section>

      <div className="min-w-0 space-y-5">
        <Section title="Deal notes"><form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); run(() => saveDealNotes(deal.id, String(fd.get("notes") ?? "")), "Deal notes saved."); }}><label className="sr-only" htmlFor={`notes-${deal.id}`}>Deal notes</label><textarea id={`notes-${deal.id}`} name="notes" defaultValue={deal.notes ?? ""} maxLength={10000} rows={4} className={inputClass} placeholder="Agreed terms, decisions and important context…" /><button disabled={pending} className={`${buttonClass} mt-2`} type="submit">Save notes</button></form></Section>
        <Section title="Documents"><Link href={`/documents/new?dealId=${deal.id}`} className={`${buttonClass} mb-3`}>Upload for this deal</Link>{linkedDocuments.length ? documentRows(linkedDocuments) : <p className="text-sm text-foreground-muted">No documents linked to this deal yet.</p>}{sharedDocuments.length > 0 && <details className="mt-3"><summary className="cursor-pointer py-2 text-sm">Shared client and property documents · {sharedDocuments.length}</summary><div className="mt-2">{documentRows(sharedDocuments)}</div></details>}<p className="mt-3 text-xs text-foreground-muted">Use a task to track missing paperwork. A file upload does not complete a task automatically.</p></Section>
        <Section title="Appointments"><Link href={`/calendar/new?dealId=${deal.id}`} className={`${buttonClass} mb-3`}>Schedule for this deal</Link>{upcomingEvents.length ? <ul className="space-y-3">{upcomingEvents.map(e => <li key={e.id}><Link href={`/calendar/${e.id}/edit`} className="break-words text-sm font-medium text-primary hover:underline">{e.title}</Link><p className="mt-1 text-xs text-foreground-muted">{new Date(e.startsAt).toLocaleString("en-GB", { timeZone: WORKSPACE_TIME_ZONE, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · Dubai</p></li>)}</ul> : <p className="text-sm text-foreground-muted">No upcoming appointments linked to this deal.</p>}<p className="mt-3 text-xs text-foreground-muted">Appointments created here stay with this deal.</p></Section>
        <Section title="Activity"><p className="mb-3 text-xs text-foreground-muted">Created {dateLabel(deal.createdAt.slice(0, 10))}. Recent changes appear below.</p>{deal.activity.length ? <ol className="space-y-3">{deal.activity.map(a => <li key={a.id} className="border-l-2 border-border pl-3"><p className="break-words text-sm">{a.summary}</p><p className="mt-1 text-xs text-foreground-muted">{new Date(a.createdAt).toLocaleString("en-GB", { timeZone: WORKSPACE_TIME_ZONE, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · Dubai</p></li>)}</ol> : <p className="text-sm text-foreground-muted">No activity recorded yet. Changes made here will appear in this history.</p>}</Section>
      </div>
    </div>
  </div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-border bg-surface p-4"><h2 className="mb-3 text-sm font-semibold">{title}</h2>{children}</section>;
}

function TaskEditor({ task, deal, pending, onSave, onCancel }: { task: Task | null; deal: DealWorkspaceData; pending: boolean; onSave: (input: TaskInput) => void; onCancel: () => void }) {
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return <form className="rounded-xl border border-primary/40 bg-primary-muted/30 p-4" onSubmit={e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    onSave({ title: String(fd.get("title") ?? ""), notes: String(fd.get("notes") ?? ""), assignee: String(fd.get("assignee") ?? ""), stage: String(fd.get("stage") ?? ""), dueDate: String(fd.get("dueDate") ?? ""), blocked: fd.get("blocked") === "on" });
  }}>
    <h3 className="mb-3 text-sm font-semibold">{task ? "Edit task" : "New task"}</h3>
    <fieldset disabled={pending} className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium sm:col-span-2">Task title<input ref={first} name="title" required maxLength={200} defaultValue={task?.title ?? ""} className={`${inputClass} mt-1`} /></label>
      <label className="min-w-0 text-xs font-medium">Responsible person<input name="assignee" maxLength={120} defaultValue={task?.assignee ?? deal.owner} className={`${inputClass} mt-1`} placeholder="Agent, client or another person" /></label>
      <label className="min-w-0 text-xs font-medium">Due date<input type="date" name="dueDate" defaultValue={task?.dueDate ?? ""} className={`${inputClass} mt-1`} /></label>
      <label className="min-w-0 text-xs font-medium sm:col-span-2">Relevant stage<select name="stage" defaultValue={task ? task.stage ?? "" : deal.stage} className={`${inputClass} mt-1`}><option value="">General deal task</option>{dealStages(deal.type).map(s => <option key={s} value={s}>{humanizeEnum(s)}</option>)}</select></label>
      <label className="text-xs font-medium sm:col-span-2">Task notes / blocker<textarea name="notes" maxLength={4000} rows={2} defaultValue={task?.notes ?? ""} className={`${inputClass} mt-1`} /></label>
      <label className="flex min-h-10 items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="blocked" defaultChecked={task?.blocked ?? false} className="size-4 accent-primary" /> Blocked — waiting on something</label>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" className={primaryClass}>Save task</button><button type="button" onClick={onCancel} className={buttonClass}>Cancel</button></div>
    </fieldset>
  </form>;
}
