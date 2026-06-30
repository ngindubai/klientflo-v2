import { ContactsSection } from "@/components/clients/contacts-section";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; area?: string }>;
}) {
  const { q, page, area } = await searchParams;
  return (
    <ContactsSection
      query={q}
      area={area}
      page={Number(page) || 1}
      basePath="/clients"
      config={{
        category: "client",
        title: "Clients",
        description:
          "Lightweight lead and client records, auto-populated from conversations.",
        searchPlaceholder: "Search name, phone, email, area…",
        emptyText: "No clients yet — add your first.",
        newHref: "/clients/new",
        newLabel: "New client",
      }}
    />
  );
}
