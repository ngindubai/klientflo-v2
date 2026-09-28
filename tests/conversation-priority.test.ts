import { describe, expect, it } from "vitest";
import { conversationPriority, HIGH_PRIORITY_INTENTS } from "@/lib/conversation-priority";
import { mockAnalyzeConversation } from "@/server/ai/mock";
describe("client priority rules", () => {
  it.each(HIGH_PRIORITY_INTENTS)("ranks %s high even without an urgency score", classification => {
    expect(conversationPriority({ classification, urgency: 1 }).level).toBe("high");
  });
  it.each(["personal", "spam"])("keeps %s below business enquiries despite urgent words", category => {
    expect(conversationPriority({ classification: "hot_lead", urgency: 5, client: { category } }).level).toBe("low");
  });
  it("keeps general enquiries medium even with an older inflated urgency score", () => expect(conversationPriority({classification: "new_enquiry", urgency: 4}).level).toBe("medium"));
  it("includes unclassified enquiries as medium and other urgent cases as high", () => {
    expect(conversationPriority({ classification: null, urgency: 1 }).level).toBe("medium");
    expect(conversationPriority({ classification: "document_request", urgency: 5 }).level).toBe("high");
  });
  it.each(["What is the price of this apartment?", "My budget is 2 million. What is the service charge?", "Does the apartment have a marina view?"])("does not mistake a general question for purchase intent: %s", text => {
    const result = mockAnalyzeConversation([{ direction: "inbound", text }]);
    expect(conversationPriority(result).level).toBe("medium");
  });
  it.each(["Can we arrange a viewing tomorrow?", "Can we negotiate the price?", "I am ready to buy this apartment"])("recognises high intent in demo classification: %s", text => {
    expect(conversationPriority(mockAnalyzeConversation([{ direction: "inbound", text }])).level).toBe("high");
  });
});
