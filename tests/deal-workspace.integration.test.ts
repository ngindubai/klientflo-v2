import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Opt-in: run only against a migrated, disposable local database.
vi.hoisted(() => {
  if (process.env.DEAL_TEST_DATABASE_URL) {
    const url = new URL(process.env.DEAL_TEST_DATABASE_URL);
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Deal integration tests require a local disposable database.");
    process.env.DATABASE_URL = process.env.DEAL_TEST_DATABASE_URL;
  }
});
vi.mock("@/server/agent", () => ({ getCurrentAgent: async () => ({ id: "qa-deals-agent", name: "QA Deal Agent" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { prisma } from "@/lib/db";
import { addSuggestedDealTasks, createDeal, saveDealNotes, saveDealTask, setDealStage, setDealTaskStatus } from "@/server/deal-actions";
import { getDealWorkspace } from "@/server/deal-workspace";
import { createEvent, updateEvent } from "@/server/event-actions";

describe.skipIf(!process.env.DEAL_TEST_DATABASE_URL)("deal workspace persistence and isolation", () => {
  beforeAll(async () => {
    await prisma.agent.deleteMany({ where: { id: { in: ["qa-deals-agent", "qa-deals-other"] } } });
    for (const id of ["qa-deals-agent", "qa-deals-other"]) await prisma.agent.create({ data: { id, name: id, email: `${id}@example.invalid` } });
    await prisma.contact.create({ data: { id: "qa-deals-client", agentId: "qa-deals-agent", name: "Shared deal client", phone: "+971590070001" } });
    for (const id of ["qa-deal-a", "qa-deal-b"]) await prisma.deal.create({ data: { id, agentId: "qa-deals-agent", clientId: "qa-deals-client", type: "rental", stage: "contract_preparation" } });
    await prisma.deal.create({ data: { id: "qa-deal-other", agentId: "qa-deals-other", type: "sale", stage: "new_enquiry" } });
  });
  afterAll(async () => {
    await prisma.agent.deleteMany({ where: { id: { in: ["qa-deals-agent", "qa-deals-other"] } } });
    await prisma.$disconnect();
  });
  it("stores tasks against the deal, even when two deals share a client", async () => {
    await saveDealTask("qa-deal-a", null, { title: "Collect signed agreement", dueDate: "2026-09-28", blocked: true, assignee: "Client", stage: "contract_preparation" });
    expect((await getDealWorkspace("qa-deal-a"))?.tasks).toHaveLength(1);
    expect((await getDealWorkspace("qa-deal-b"))?.tasks).toHaveLength(0);
  });
  it("rejects another agent's deal and a task belonging to a different deal", async () => {
    const task = await prisma.dealTask.findFirstOrThrow({ where: { dealId: "qa-deal-a" } });
    expect(await getDealWorkspace("qa-deal-other")).toBeNull();
    await expect(saveDealNotes("qa-deal-other", "Wrong agent")).rejects.toThrow("Deal not found");
    await expect(saveDealTask("qa-deal-other", null, { title: "Wrong agent" })).rejects.toThrow("Deal not found");
    await expect(setDealStage("qa-deal-other", "qualified")).rejects.toThrow("Deal not found");
    await expect(setDealTaskStatus("qa-deal-b", task.id, "done")).rejects.toThrow("Task not found");
    await expect(saveDealTask("qa-deal-b", task.id, { title: "Wrong deal" })).rejects.toThrow("Task not found");
  });
  it("adds suggestions once, preserving custom tasks and dismissed suggestions", async () => {
    expect(await addSuggestedDealTasks("qa-deal-a")).toBe(4);
    const task = await prisma.dealTask.findFirstOrThrow({ where: { dealId: "qa-deal-a", templateKey: { not: null } } });
    await setDealTaskStatus("qa-deal-a", task.id, "dismissed");
    expect(await addSuggestedDealTasks("qa-deal-a")).toBe(0);
    expect(await prisma.dealTask.count({ where: { dealId: "qa-deal-a" } })).toBe(5);
  });
  it("edits, completes and reopens tasks with history and stable deadlines", async () => {
    const task = await prisma.dealTask.findFirstOrThrow({ where: { dealId: "qa-deal-a", templateKey: null } });
    await saveDealTask("qa-deal-a", task.id, { title: "Review signed agreement", dueDate: "2026-10-02", notes: "Awaiting client", assignee: "Agent", blocked: true });
    await setDealTaskStatus("qa-deal-a", task.id, "done");
    expect((await prisma.dealTask.findUniqueOrThrow({ where: { id: task.id } })).completedAt).not.toBeNull();
    await setDealTaskStatus("qa-deal-a", task.id, "pending");
    const reopened = await prisma.dealTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(reopened.completedAt).toBeNull();
    expect(reopened.dueAt?.toISOString().slice(0, 10)).toBe("2026-10-02");
    expect((await getDealWorkspace("qa-deal-a"))?.activity.some(a => a.summary.includes("Reopened task"))).toBe(true);
  });
  it("changes stage without completing tasks and rejects a sale-only stage", async () => {
    const before = await prisma.dealTask.count({ where: { dealId: "qa-deal-a", status: "pending" } });
    await setDealStage("qa-deal-a", "cheques_collected");
    expect(await prisma.dealTask.count({ where: { dealId: "qa-deal-a", status: "pending" } })).toBe(before);
    await expect(setDealStage("qa-deal-a", "form_f_mou")).rejects.toThrow("Invalid stage");
    await expect(setDealTaskStatus("qa-deal-a", "missing", "invalid")).rejects.toThrow("Invalid task status");
  });
  it("persists notes and excludes documents explicitly attached to a sibling deal", async () => {
    await saveDealNotes("qa-deal-a", "Agreed details for deal A");
    for (const [id, dealId] of [["qa-doc-a", "qa-deal-a"], ["qa-doc-b", "qa-deal-b"], ["qa-doc-shared", null]] as const) await prisma.document.create({ data: { id, agentId: "qa-deals-agent", clientId: "qa-deals-client", dealId, name: id, category: "client", type: "passport" } });
    const data = await getDealWorkspace("qa-deal-a");
    expect(data?.notes).toBe("Agreed details for deal A");
    expect(data?.documents.map(d => d.id).sort()).toEqual(["qa-doc-a", "qa-doc-shared"]);
  });
  it("keeps appointment links on creation and editing without leaking to the sibling deal", async () => {
    const input = { title: "Deal signing", type: "contract_signing", startsAt: "2026-10-03T10:00", endsAt: "2026-10-03T11:00", dealId: "qa-deal-a", clientId: "qa-deals-client" };
    await expect(createEvent(input)).rejects.toThrow("REDIRECT:/deals/qa-deal-a");
    const event = await prisma.event.findFirstOrThrow({ where: { dealId: "qa-deal-a" } });
    await expect(updateEvent(event.id, { ...input, dealId: undefined, title: "Rescheduled signing" })).rejects.toThrow("REDIRECT:/deals/qa-deal-a");
    expect((await getDealWorkspace("qa-deal-a"))?.events[0].title).toBe("Rescheduled signing");
    expect((await getDealWorkspace("qa-deal-b"))?.events).toHaveLength(0);
    await expect(createEvent({ ...input, dealId: "qa-deal-other" })).rejects.toThrow("Deal not found");
  });
  it("creates deals with an optional checklist and opens the new specific deal", async () => {
    await expect(createDeal({ type: "sale", stage: "documents_requested", notes: "Created with checklist" })).rejects.toThrow("REDIRECT:/deals/");
    const deal = await prisma.deal.findFirstOrThrow({ where: { notes: "Created with checklist", agentId: "qa-deals-agent" }, include: { tasks: true } });
    expect(deal.tasks.length).toBeGreaterThan(0);
    expect(deal.tasks.every(t => t.status === "pending" && t.dueAt === null)).toBe(true);
    await expect(createDeal({ type: "rental", includeChecklist: false, notes: "Empty checklist" })).rejects.toThrow("REDIRECT:/deals/");
    const empty = await prisma.deal.findFirstOrThrow({ where: { notes: "Empty checklist", agentId: "qa-deals-agent" }, include: { tasks: true } });
    expect(empty.tasks).toHaveLength(0);
  });
});
