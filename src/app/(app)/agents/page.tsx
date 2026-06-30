import { ContactsSection } from "@/components/clients/contacts-section";

export const dynamic = "force-dynamic";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <ContactsSection
      query={q}
      config={{
        category: "agent",
        title: "Agents",
        description:
          "External brokers and fellow agents — tag a WhatsApp conversation as Agent to add them here.",
        searchPlaceholder: "Search name, agency, phone…",
        emptyText: "No agents yet — tag a conversation as Agent to add one.",
      }}
    />
  );
}
