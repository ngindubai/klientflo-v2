import { PageHeader } from "@/components/layout/page-header";
import { TemplateManager } from "@/components/storage/template-manager";
import { MediaManager } from "@/components/storage/media-manager";
import { getTemplates } from "@/server/templates";
import { getMedia } from "@/server/media";
import { getPropertyOptions } from "@/server/properties";
import { getContactsBrief } from "@/server/clients";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "templates", label: "Templates" },
  { key: "floorplans", label: "Floorplans" },
  { key: "videos", label: "Videos" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default async function StoragePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active: Tab = TABS.some((t) => t.key === tab) ? (tab as Tab) : "templates";

  return (
    <>
      <PageHeader
        title={active === "templates" ? "Sales pack templates" : active === "floorplans" ? "Floor plans" : "Videos"}
        description="Templates that generate branded PDFs, plus floorplans and videos."
      />

      {active === "templates" && <TemplatesTab />}
      {active === "floorplans" && <MediaTab type="floorplan" />}
      {active === "videos" && <MediaTab type="video" />}
    </>
  );
}

async function TemplatesTab() {
  const [templates, properties, contacts] = await Promise.all([
    getTemplates(),
    getPropertyOptions(),
    getContactsBrief(),
  ]);
  return (
    <TemplateManager
      templates={templates}
      properties={properties}
      contacts={contacts}
    />
  );
}

async function MediaTab({ type }: { type: "floorplan" | "video" }) {
  const [items, properties] = await Promise.all([
    getMedia(type),
    getPropertyOptions(),
  ]);
  return <MediaManager type={type} items={items} properties={properties} />;
}
