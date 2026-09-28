import { describe, expect, it } from "vitest";
import { parseTaskInput, suggestedDealTasks, taskSummary } from "@/lib/deal-workflow";

describe("deal checklists", () => {
  it("uses only the relevant sales stages from the current stage onwards", () => {
    const tasks = suggestedDealTasks("sale", "offer_accepted");
    expect(tasks[0].stage).toBe("offer_accepted");
    expect(tasks.some(t => t.stage === "form_f_mou")).toBe(true);
    expect(tasks.some(t => t.stage === "contract_preparation" || t.stage === "new_enquiry")).toBe(false);
    expect(new Set(tasks.map(t => t.templateKey)).size).toBe(tasks.length);
  });
  it("uses rental stages and leaves closed deals without a suggested checklist", () => {
    expect(suggestedDealTasks("rental", "contract_preparation").map(t => t.stage)).toEqual(["contract_preparation", "cheques_collected", "ejari_stage", "handover"]);
    expect(suggestedDealTasks("rental", "closed_won")).toEqual([]);
    expect(suggestedDealTasks("sale", "closed_lost")).toEqual([]);
  });
});

describe("task validation and triage", () => {
  it("rejects empty titles and stages from the other pipeline", () => {
    expect(() => parseTaskInput({ title: "  " }, "sale")).toThrow();
    expect(() => parseTaskInput({ title: "Task", stage: "ejari_stage" }, "sale")).toThrow();
    expect(() => parseTaskInput({ title: "x".repeat(201) }, "rental")).toThrow();
  });
  it("rejects invalid calendar dates and keeps date-only deadlines stable", () => {
    expect(() => parseTaskInput({ title: "Task", dueDate: "2026-02-30" }, "sale")).toThrow();
    expect(() => parseTaskInput({ title: "Task", dueDate: "tomorrow" }, "sale")).toThrow();
    expect(parseTaskInput({ title: " Task ", dueDate: "2028-02-29" }, "sale").dueAt?.toISOString()).toBe("2028-02-29T00:00:00.000Z");
    expect(parseTaskInput({ title: "Task", dueDate: "" }, "rental").dueAt).toBeNull();
  });
  it("counts only outstanding work and chooses the oldest deadline before undated tasks", () => {
    const tasks = [
      { title: "Later", status: "pending", dueAt: null, blocked: false, stage: "handover" },
      { title: "Yesterday", status: "pending", dueAt: new Date("2026-09-28"), blocked: true, stage: "qualified" },
      { title: "Today", status: "pending", dueAt: new Date("2026-09-29"), blocked: false, stage: "qualified" },
      { title: "Done", status: "done", dueAt: new Date("2026-01-01"), blocked: true, stage: null },
      { title: "Dismissed", status: "dismissed", dueAt: new Date("2026-01-01"), blocked: true, stage: null },
    ];
    expect(taskSummary(tasks, "qualified", "2026-09-29")).toEqual({ open: 3, overdue: 1, blocked: 1, next: { title: "Yesterday", dueDate: "2026-09-28" } });
  });
  it("surfaces an undated blocker before routine future work", () => {
    const result = taskSummary([
      { title: "Future follow-up", status: "pending", dueAt: new Date("2026-10-10"), blocked: false, stage: "qualified" },
      { title: "Missing agreement", status: "pending", dueAt: null, blocked: true, stage: "contract_preparation" },
    ], "qualified", "2026-09-29");
    expect(result.next?.title).toBe("Missing agreement");
  });
});
