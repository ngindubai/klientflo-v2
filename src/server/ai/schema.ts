import { z } from "zod";
import {
  CONVERSATION_CLASSIFICATIONS,
  CONTACT_CATEGORIES,
  CLIENT_TYPES,
  PAYMENT_METHODS,
} from "@/lib/constants";

// The structured shape Claude returns for a conversation analysis. Mirrors the
// fields we persist on Conversation + the requirements we extract for a Client.
export const RequirementsSchema = z.object({
  clientType: z.enum(CLIENT_TYPES).nullable(),
  area: z.string().nullable(),
  budgetMin: z.number().int().nullable(),
  budgetMax: z.number().int().nullable(),
  bedrooms: z.number().int().nullable(),
  propertyType: z.string().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable(),
  timeline: z.string().nullable(),
});

export const ConversationAnalysisSchema = z.object({
  classification: z.enum(CONVERSATION_CLASSIFICATIONS),
  urgency: z.number().int().min(1).max(5),
  summary: z.string(),
  // Who this contact is, for tagging: a client (buyer/tenant/seller/landlord),
  // an external agent/broker, an investor, spam, or a personal contact.
  contactCategory: z.enum(CONTACT_CATEGORIES),
  requirements: RequirementsSchema,
  suggestedNextAction: z.string(),
});

export type Requirements = z.infer<typeof RequirementsSchema>;
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;

/** A single message fed into the analyser. */
export type AnalysisMessage = {
  direction: "inbound" | "outbound";
  /** Text body, or the transcription for a voice note. */
  text: string;
};
