/**
 * Domain constants for Klientflo.
 *
 * These are the shared vocabulary of the app — navigation, pipeline stages,
 * urgency levels, conversation classifications, and document types — used
 * across the dashboard, AI layer, and data model. Kept framework-free so they
 * can be imported on both the server and the client.
 */

export const APP_NAME = "Klientflo";

// --- Navigation ----------------------------------------------------------

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "WhatsApp Inbox", href: "/inbox", icon: "inbox" },
  { label: "Clients", href: "/clients", icon: "clients" },
  { label: "Agents", href: "/agents", icon: "agents" },
  { label: "Investors", href: "/investors", icon: "investors" },
  { label: "Properties", href: "/properties", icon: "properties" },
  { label: "Owners", href: "/owners", icon: "owners" },
  { label: "Pipeline", href: "/pipeline", icon: "pipeline" },
  { label: "Reports", href: "/reports", icon: "reports" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Documents", href: "/documents", icon: "documents" },
  { label: "Storage", href: "/storage", icon: "storage" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

// --- Conversation classification ----------------------------------------

export const CONVERSATION_CLASSIFICATIONS = [
  "new_enquiry",
  "buyer",
  "tenant",
  "seller",
  "landlord",
  "hot_lead",
  "viewing_request",
  "price_negotiation",
  "document_request",
  "contract_stage",
  "payment_stage",
  "existing_client",
  "low_priority",
  "spam",
] as const;
export type ConversationClassification =
  (typeof CONVERSATION_CLASSIFICATIONS)[number];

// --- Urgency (1 = calm, 5 = immediate action required) -------------------

export const URGENCY_LEVELS = [1, 2, 3, 4, 5] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  1: "Low",
  2: "Moderate",
  3: "Elevated",
  4: "High",
  5: "Immediate",
};

// --- Client / lead types -------------------------------------------------

export const CLIENT_TYPES = ["buyer", "tenant", "seller", "landlord"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const PAYMENT_METHODS = ["mortgage", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// --- Contact tagging -----------------------------------------------------
// WhatsApp contacts are tagged into one of these categories. "agent" means an
// external broker (not the internal Agent/owner). Drives the inbox tag filter
// and the Agents / Investors sections.

export const CONTACT_CATEGORIES = [
  "client",
  "agent",
  "investor",
  "spam",
  "personal",
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, string> = {
  client: "Client",
  agent: "Agent",
  investor: "Investor",
  spam: "Spam",
  personal: "Personal",
};

/** Tailwind chip classes per category (background + text + border). */
export const CONTACT_CATEGORY_CHIP: Record<ContactCategory, string> = {
  client: "bg-primary-muted text-primary border-primary/30",
  agent: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  investor: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  spam: "bg-red-500/15 text-red-600 border-red-500/30",
  personal: "bg-surface-muted text-foreground-muted border-border",
};

// --- Pipelines -----------------------------------------------------------

export const SALES_PIPELINE_STAGES = [
  "new_enquiry",
  "qualified",
  "properties_sent",
  "viewing_booked",
  "viewing_completed",
  "offer_submitted",
  "offer_accepted",
  "documents_requested",
  "form_f_mou",
  "deposit_stage",
  "trustee_office_booked",
  "transfer_completed",
  "closed_won",
  "closed_lost",
] as const;
export type SalesPipelineStage = (typeof SALES_PIPELINE_STAGES)[number];

export const RENTAL_PIPELINE_STAGES = [
  "new_enquiry",
  "qualified",
  "properties_sent",
  "viewing_booked",
  "viewing_completed",
  "offer_submitted",
  "offer_accepted",
  "documents_requested",
  "contract_preparation",
  "cheques_collected",
  "ejari_stage",
  "handover",
  "closed_won",
  "closed_lost",
] as const;
export type RentalPipelineStage = (typeof RENTAL_PIPELINE_STAGES)[number];

export const DEAL_TYPES = ["sale", "rental"] as const;
export type DealType = (typeof DEAL_TYPES)[number];

// --- Calendar events -----------------------------------------------------

export const EVENT_TYPES = [
  "viewing",
  "office_meeting",
  "trustee_office_meeting",
  "contract_signing",
  "handover",
  "follow_up",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// --- Documents -----------------------------------------------------------

export const CLIENT_DOCUMENT_TYPES = [
  "passport",
  "emirates_id",
  "visa",
  "proof_of_funds",
  "mortgage_approval",
] as const;

export const PROPERTY_DOCUMENT_TYPES = [
  "title_deed",
  "oqood",
  "permit",
  "floor_plan",
] as const;

export const TRANSACTION_DOCUMENT_TYPES = [
  "form_a",
  "form_b",
  "form_f",
  "tenancy_contract",
  "cheque_copy",
  "receipt",
  "trustee_office_confirmation",
] as const;

export const DOCUMENT_TYPES = [
  ...CLIENT_DOCUMENT_TYPES,
  ...PROPERTY_DOCUMENT_TYPES,
  ...TRANSACTION_DOCUMENT_TYPES,
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_CATEGORIES = ["client", "property", "transaction"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** The document types valid for each category, for category-aware forms. */
export const DOCUMENT_TYPES_BY_CATEGORY: Record<
  DocumentCategory,
  readonly string[]
> = {
  client: CLIENT_DOCUMENT_TYPES,
  property: PROPERTY_DOCUMENT_TYPES,
  transaction: TRANSACTION_DOCUMENT_TYPES,
};

// --- Property sources ----------------------------------------------------

export const PROPERTY_SOURCES = ["property_finder", "bayut", "manual"] as const;
export type PropertySource = (typeof PROPERTY_SOURCES)[number];

/** Turn a snake_case enum value into a human label, e.g. "form_f_mou" → "Form F / MOU". */
export function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
