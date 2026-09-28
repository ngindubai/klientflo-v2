import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/server/agent", () => ({ getCurrentAgent: async () => ({ id: "agent" }) }));
vi.mock("@/server/ai/client", () => ({ getAnthropic: () => null, isAIEnabled: () => false, AI_MODEL: "mock" }));
import { runCommand } from "@/server/ai/command";
describe("demo command navigation", () => {
  it.each([["Open the inbox", "/inbox"], ["Open conversations", "/inbox"], ["Go to calendar", "/calendar"], ["Open contacts", "/clients"], ["Open investors", "/investors"], ["Open pipeline", "/pipeline"]])("routes %s to %s without a connected AI provider", async (command, href) => {
    expect(await runCommand(command)).toMatchObject({kind:"navigate", href});
  });
});
