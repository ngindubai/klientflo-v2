import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  sendText: vi.fn(), updateConversation: vi.fn(), createMessage: vi.fn(), updateMessage: vi.fn(),
  findConversation: vi.fn(), findMessage: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: { conversation: { findFirst: mocks.findConversation, update: mocks.updateConversation }, message: { create: mocks.createMessage, findFirst: mocks.findMessage, update: mocks.updateMessage } } }));
vi.mock("@/server/agent", () => ({ getCurrentAgent: async () => ({ id: "agent" }) }));
vi.mock("@/server/whatsapp", () => ({ sendText: mocks.sendText, isWhatsAppConfigured: () => false, downloadMedia: vi.fn() }));
vi.mock("@/server/speech", () => ({ isSpeechConfigured: () => false, transcribeAudio: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/ai/client", () => ({ getAnthropic: () => null, isAIEnabled: () => false, AI_MODEL: "mock" }));
vi.mock("@/server/ai/analyze", () => ({ analyzeConversation: vi.fn() }));
import { sendReply, approveDraft } from "@/server/message-actions";
import { transcribeVoiceNote } from "@/server/voice-actions";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.findConversation.mockResolvedValue({ id: "conversation", contactPhone: "+971500000000" });
  mocks.findMessage.mockResolvedValue({ id: "message", conversationId: "conversation", body: "Hello", mediaUrl: "test", conversation: { contactPhone: "+971500000000" } });
});
describe("delivery failures and disconnected voice notes", () => {
  it("keeps a failed reply in the needs-reply queue", async () => {
    mocks.sendText.mockRejectedValue(new Error("Unavailable"));
    const result = await sendReply("conversation", "Hello");
    expect(result.status).toBe("failed");
    expect(mocks.updateConversation).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ awaitingReply: true }) }));
    expect(mocks.createMessage).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) }));
  });
  it("keeps a failed approved draft in the needs-reply queue", async () => {
    mocks.sendText.mockRejectedValue(new Error("Unavailable"));
    expect((await approveDraft("message")).status).toBe("failed");
    expect(mocks.updateConversation).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ awaitingReply: true }) }));
  });
  it("marks a successful simulated reply clearly", async () => {
    mocks.sendText.mockResolvedValue({ externalId: "mock-1" });
    expect(await sendReply("conversation", "Hello")).toEqual({ status: "sent", demo: true });
    expect(mocks.updateConversation).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ awaitingReply: false }) }));
  });
  it("does not write a fake transcript when services are disconnected", async () => {
    expect((await transcribeVoiceNote("message")).error).toContain("No transcript has been generated");
    expect(mocks.updateMessage).not.toHaveBeenCalled();
    expect(mocks.updateConversation).not.toHaveBeenCalled();
  });
});
