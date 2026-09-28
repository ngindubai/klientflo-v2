import { SALES_PIPELINE_STAGES, RENTAL_PIPELINE_STAGES, type DealType } from "./constants";

export function dealStages(type: DealType): readonly string[] {
  return type === "rental" ? RENTAL_PIPELINE_STAGES : SALES_PIPELINE_STAGES;
}

// Suggestions, not compliance requirements. Dates and completion are set by the agent.
const CHECKLIST: Record<string, string> = {
  new_enquiry: "Confirm the client's requirements and budget",
  qualified: "Confirm timing and payment arrangements",
  properties_sent: "Follow up on the property shortlist",
  viewing_booked: "Confirm the viewing with everyone attending",
  viewing_completed: "Record viewing feedback and agree the next step",
  offer_submitted: "Follow up on the offer and record the response",
  offer_accepted: "Record the agreed terms and next steps",
  documents_requested: "Review the documents needed for this deal",
  form_f_mou: "Coordinate review and signing of the agreement",
  deposit_stage: "Confirm deposit arrangements and record receipt",
  trustee_office_booked: "Confirm the transfer appointment and attendees",
  transfer_completed: "Record transfer confirmation and final follow-up",
  contract_preparation: "Coordinate review and signing of the tenancy contract",
  cheques_collected: "Confirm payment collection and record receipts",
  ejari_stage: "Follow up on registration and record confirmation",
  handover: "Confirm handover arrangements and completion",
};

export function suggestedDealTasks(type: DealType, currentStage: string) {
  if (currentStage.startsWith("closed_")) return [];
  const stages = dealStages(type);
  return stages.slice(Math.max(0, stages.indexOf(currentStage)))
    .filter(stage => CHECKLIST[stage])
    .map(stage => ({ stage, title: CHECKLIST[stage], templateKey: `${type}:${stage}:v1` }));
}

export type TaskInput = {
  title: string; notes?: string; assignee?: string; stage?: string;
  dueDate?: string; blocked?: boolean;
};

export function parseTaskInput(input: TaskInput, type: DealType) {
  const title = input.title?.trim();
  if (!title || title.length > 200) throw new Error("Enter a task title of 1–200 characters.");
  const notes = input.notes?.trim() || null;
  const assignee = input.assignee?.trim() || null;
  if ((notes?.length ?? 0) > 4000) throw new Error("Keep task notes under 4,000 characters.");
  if ((assignee?.length ?? 0) > 120) throw new Error("Keep the responsible person's name under 120 characters.");
  const stage = input.stage?.trim() || null;
  if (stage && !dealStages(type).includes(stage)) throw new Error("Choose a stage from this deal's pipeline.");
  const dueDate = input.dueDate?.trim();
  const dueAt = dueDate ? new Date(`${dueDate}T00:00:00.000Z`) : null;
  if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !dueAt || Number.isNaN(dueAt.getTime()) || dueAt.toISOString().slice(0, 10) !== dueDate)) {
    throw new Error("Enter a valid due date.");
  }
  return { title, notes, assignee, stage, dueAt, blocked: input.blocked === true };
}

export type TaskSummaryInput = {
  title: string; status: string; dueAt: Date | null; blocked: boolean; stage: string | null;
};

export function taskSummary(tasks: TaskSummaryInput[], stage: string, today: string) {
  const open = tasks.filter(t => t.status === "pending");
  const rank = (t: TaskSummaryInput) => {
    const date = t.dueAt?.toISOString().slice(0, 10);
    if (date && date < today) return 0;
    if (date === today) return 1;
    if (t.blocked) return 2;
    if (date) return 3;
    return !t.stage || t.stage === stage ? 4 : 5;
  };
  const sorted = [...open].sort((a, b) => {
    // Overdue and today's work first, then blockers; undated later steps last.
    const date = (a.dueAt?.toISOString() ?? "9999").localeCompare(b.dueAt?.toISOString() ?? "9999");
    return rank(a) - rank(b) || date;
  });
  const next = sorted[0];
  return {
    open: open.length,
    overdue: open.filter(t => t.dueAt && t.dueAt.toISOString().slice(0, 10) < today).length,
    blocked: open.filter(t => t.blocked).length,
    next: next ? { title: next.title, dueDate: next.dueAt?.toISOString().slice(0, 10) ?? null } : null,
  };
}
