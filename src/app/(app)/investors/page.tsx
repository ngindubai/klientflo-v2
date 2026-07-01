import { ContactsSection } from "@/components/clients/contacts-section";

export const dynamic = "force-dynamic";

export default async function InvestorsPage({
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
      basePath="/investors"
      variant="table"
      config={{
        category: "investor",
        title: "Investors",
        description:
          "Investor contacts and their criteria — tag a WhatsApp conversation as Investor to add them here.",
        searchPlaceholder: "Search name, phone, area…",
        emptyText: "No investors yet — tag a conversation as Investor to add one.",
      }}
    />
  );
}
