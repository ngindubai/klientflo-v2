import { ExternalLink, Trash2, Upload, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { uploadMedia, addMediaLink, deleteMedia } from "@/server/media-actions";

type MediaItem = {
  id: string;
  name: string;
  fileUrl: string | null;
  externalUrl: string | null;
  property: { id: string; title: string } | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function PropertySelect({
  properties,
}: {
  properties: { id: string; title: string }[];
}) {
  return (
    <select name="propertyId" className={inputClass} defaultValue="">
      <option value="">No linked property</option>
      {properties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.title}
        </option>
      ))}
    </select>
  );
}

/**
 * Floorplan / video manager. Files upload to blob storage; videos can also be
 * added as external links (YouTube/Vimeo/Drive).
 */
export function MediaManager({
  type,
  items,
  properties,
}: {
  type: "floorplan" | "video";
  items: MediaItem[];
  properties: { id: string; title: string }[];
}) {
  const isVideo = type === "video";
  const noun = isVideo ? "video" : "floorplan";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upload file */}
        <Card className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Upload className="size-4" /> Upload {noun}
          </p>
          <form action={uploadMedia} className="space-y-3">
            <input type="hidden" name="type" value={type} />
            <input
              name="name"
              placeholder={`${noun} name (optional)`}
              className={inputClass}
            />
            <input
              type="file"
              name="file"
              required
              accept={isVideo ? "video/*" : "image/*,application/pdf"}
              className={inputClass}
            />
            <PropertySelect properties={properties} />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Upload
            </button>
          </form>
        </Card>

        {/* Add link (videos primarily, but allowed for both) */}
        <Card className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Link2 className="size-4" /> Add {noun} link
          </p>
          <form action={addMediaLink} className="space-y-3">
            <input type="hidden" name="type" value={type} />
            <input
              name="name"
              placeholder={`${noun} name (optional)`}
              className={inputClass}
            />
            <input
              name="externalUrl"
              required
              placeholder="https://…"
              className={inputClass}
            />
            <PropertySelect properties={properties} />
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Add link
            </button>
          </form>
        </Card>
      </div>

      {/* List */}
      <Card className="p-4">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            No {noun}s yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((m) => {
              const href = m.fileUrl ?? m.externalUrl ?? "#";
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 truncate text-sm font-medium hover:text-primary"
                    >
                      {m.name}
                      <ExternalLink className="size-3.5 shrink-0 text-foreground-muted" />
                    </a>
                    <p className="truncate text-xs text-foreground-muted">
                      {m.externalUrl ? "Link" : "Uploaded file"}
                      {m.property ? ` · ${m.property.title}` : ""}
                    </p>
                  </div>
                  <form action={deleteMedia.bind(null, m.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
