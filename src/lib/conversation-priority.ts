/** Client-defined business priorities; personal/spam tags take precedence. */
export const HIGH_PRIORITY_INTENTS = ["viewing_request", "price_negotiation", "hot_lead", "contract_stage", "payment_stage"] as const;
export const GENERAL_PRIORITY_INTENTS = ["new_enquiry", "buyer", "tenant", "seller", "landlord", "existing_client"] as const;
export type PriorityLevel = "high" | "medium" | "low";
export const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low" };
export const PRIORITY_STYLES = { high: "border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200", medium: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200", low: "border-border bg-surface-muted text-foreground-muted" };
export function priorityLevel(value?: string): PriorityLevel | undefined {
  return value === "high" || value === "medium" || value === "low" ? value : undefined;
}
export function conversationPriority(c: { classification: string | null; urgency: number; client?: { category: string } | null }): { level: PriorityLevel; reason: string } {
  if (c.client?.category === "spam" || c.classification === "spam") return { level: "low", reason: "Spam" };
  if (c.client?.category === "personal") return { level: "low", reason: "Personal" };
  if (c.classification === "low_priority") return { level: "low", reason: "Low priority" };
  const reasons: Record<string, string> = { viewing_request: "Viewing request", price_negotiation: "Active negotiation", hot_lead: "Ready to buy", contract_stage: "Contract in progress", payment_stage: "Payment stage" };
  if (c.classification && reasons[c.classification]) return { level: "high", reason: reasons[c.classification] };
  if (c.urgency >= 4 && !GENERAL_PRIORITY_INTENTS.includes(c.classification as never)) return { level: "high", reason: "Urgent follow-up" };
  return { level: "medium", reason: c.classification === "document_request" ? "Document question" : "Property enquiry" };
}
