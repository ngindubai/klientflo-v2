// Shapes returned by the AI command bar. Kept framework-free so both the
// server engine and the client renderer can import them.

export type ClientCard = {
  id: string;
  name: string;
  subtitle: string;
};

export type PropertyCard = {
  id: string;
  title: string;
  price: number;
  area: string | null;
  bedrooms: number | null;
};

export type ConversationCard = {
  id: string;
  name: string;
  urgency: number;
  summary: string;
};

export type EventCard = {
  id: string;
  title: string;
  time: string; // HH:mm
  type: string;
};

export type CommandResult =
  | { kind: "clients"; message: string; clients: ClientCard[] }
  | { kind: "properties"; message: string; properties: PropertyCard[] }
  | {
      kind: "conversations";
      message: string;
      conversations: ConversationCard[];
    }
  | { kind: "events"; message: string; events: EventCard[] }
  | { kind: "draft"; message: string; draft: string; recipient?: string }
  | { kind: "navigate"; message: string; href: string }
  | { kind: "info"; message: string };
