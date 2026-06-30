import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateManager } from "@/components/storage/template-manager";
import { MediaManager } from "@/components/storage/media-manager";
import { getTemplates } from "@/server/templates";
import { getMedia } from "@/server/media";
import { getPropertyOptions } from "@/server/properties";

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
        title="Storage"
        description="Templates that generate branded PDFs, plus floorplans and videos."
      />

      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/storage?tab=${t.key}`}
            className={
              "border-b-2 px-4 py-2 text-sm font-medium " +
              (t.key === active
                ? "border-primary text-primary"
                : "border-transparent text-foreground-muted hover:text-foreground")
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {active === "templates" && <TemplatesTab />}
      {active === "floorplans" && <MediaTab type="floorplan" />}
      {active === "videos" && <MediaTab type="video" />}
    </>
  );
}

async function TemplatesTab() {
  const [templates, properties] = await Promise.all([
    getTemplates(),
    getPropertyOptions(),
  ]);
  return <TemplateManager templates={templates} properties={properties} />;
}

async function MediaTab({ type }: { type: "floorplan" | "video" }) {
  const [items, properties] = await Promise.all([
    getMedia(type),
    getPropertyOptions(),
  ]);
  return <MediaManager type={type} items={items} properties={properties} />;
}
