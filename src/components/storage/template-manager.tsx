"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileText, ExternalLink, Send } from "lucide-react";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/server/template-actions";
import { MERGE_FIELDS } from "@/server/pdf/merge";
import { BulkSend } from "@/components/storage/bulk-send";
import type { ContactCategory } from "@/lib/constants";

type Template = { id: string; name: string; kind: string; body: string };
type PropertyOption = { id: string; title: string };
type Contact = {
  id: string;
  name: string;
  phone: string;
  category: ContactCategory;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

const KINDS = ["brochure", "offer", "custom"];

export function TemplateManager({
  templates,
  properties,
  contacts,
}: {
  templates: Template[];
  properties: PropertyOption[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Template | "new" | null>(null);
  const [sending, setSending] = useState<Template | null>(null);

  if (sending) {
    return (
      <BulkSend
        templateId={sending.id}
        templateName={sending.name}
        properties={properties}
        contacts={contacts}
        onClose={() => setSending(null)}
      />
    );
  }

  if (editing) {
    return (
      <TemplateEditor
        template={editing === "new" ? null : editing}
        onDone={() => {
          setEditing(null);
          router.refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-10 text-center text-sm text-foreground-muted">
          No templates yet. Create one with merge fields like{" "}
          <code>{"{{property.price}}"}</code> to generate branded PDFs.
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <FileText className="size-4 text-primary" /> {t.name}
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-normal text-foreground-muted">
                      {t.kind}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-foreground-muted">
                    {t.body || "Empty template"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => setSending(t)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted"
                    title="Send to clients"
                  >
                    <Send className="size-3.5" /> Send
                  </button>
                  <button
                    onClick={() => setEditing(t)}
                    className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                    title="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <DeleteButton id={t.id} onDone={() => router.refresh()} />
                </div>
              </div>

              <PdfPreview templateId={t.id} properties={properties} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PdfPreview({
  templateId,
  properties,
}: {
  templateId: string;
  properties: PropertyOption[];
}) {
  const [propertyId, setPropertyId] = useState("");
  if (properties.length === 0) {
    return (
      <p className="mt-3 text-xs text-foreground-muted">
        Add a property to preview this template as a PDF.
      </p>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <span className="text-xs text-foreground-muted">Preview PDF for</span>
      <select
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
        aria-label="Property for PDF preview"
        className="max-w-full min-w-0 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none"
      >
        <option value="">Choose property…</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      {propertyId && (
        <a
          href={`/api/templates/${templateId}/pdf?propertyId=${propertyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Open PDF <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function DeleteButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this template?"))
          start(() => deleteTemplate(id).then(onDone));
      }}
      className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function TemplateEditor({
  template,
  onDone,
  onCancel,
}: {
  template: Template | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [kind, setKind] = useState(template?.kind ?? "brochure");
  const [body, setBody] = useState(template?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertField(token: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const startPos = el.selectionStart ?? body.length;
    const endPos = el.selectionEnd ?? body.length;
    setBody(body.slice(0, startPos) + token + body.slice(endPos));
    requestAnimationFrame(() => {
      el.focus();
      const pos = startPos + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function save() {
    setError(null);
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }
    start(async () => {
      try {
        if (template) await updateTemplate(template.id, { name, kind, body });
        else await createTemplate({ name, kind, body });
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold">
        {template ? "Edit template" : "New template"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Name
          </label>
          <input
            className={inputClass}
            aria-label="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="2-bed brochure"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Kind
          </label>
          <select
            className={inputClass}
            aria-label="Template kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-foreground-muted">
          Body — click a field to insert a merge token
        </label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {MERGE_FIELDS.map((f) => (
            <button
              key={f.token}
              type="button"
              onClick={() => insertField(f.token)}
              className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-foreground-muted hover:border-primary hover:text-primary"
              title={f.token}
            >
              {f.label}
            </button>
          ))}
        </div>
        <textarea
          aria-label="Template body"
          ref={bodyRef}
          rows={10}
          className={inputClass}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={"Presenting {{property.title}} in {{property.area}}.\n\nPriced at {{property.price}}.\n\n{{property.description}}\n\nContact {{agent.name}} on {{agent.phone}}."}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save template"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
