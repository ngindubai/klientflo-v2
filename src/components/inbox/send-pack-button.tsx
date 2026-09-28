"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendPackToConversation, previewConversationPack } from "@/server/conversation-pack";
import type { BulkSendResult } from "@/server/bulk-send";
import { Modal } from "@/components/ui/modal";
const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";
export function SendPackButton({ conversationId, templates, properties, recipient, demo }: { conversationId: string; templates: { id: string; name: string }[]; properties: { id: string; title: string }[]; recipient: string; demo: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [propertyId, setPropertyId] = useState("");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewConversationPack>> | null>(null);
  const [previewing, startPreview] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<BulkSendResult | null>(null);
  const [pending, start] = useTransition();
  const pdf = `/api/templates/${encodeURIComponent(templateId)}/pdf?propertyId=${encodeURIComponent(propertyId)}`;
  function send() {
    start(async () => { setError(""); try { setResult(await sendPackToConversation({ conversationId, templateId, propertyId, caption })); router.refresh(); } catch { setError("Could not generate or send this pack. Please try again."); } });
  }
  return <>
    <button onClick={() => { setOpen(true); setResult(null); setPreview(null); setError(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium hover:bg-surface-muted"><FileText className="size-3.5" />Sales pack</button>
    {open && <Modal title="Send a sales pack" onClose={() => { if (!pending) setOpen(false); }}>
      <p className="mb-3 text-sm">To <strong>{recipient}</strong></p>
      {demo && <p className="mb-4 rounded-lg bg-primary-muted px-3 py-2 text-xs text-primary">Demo mode · PDF generation is available. Sending is simulated until the approved WhatsApp connection is enabled.</p>}
      {!templates.length || !properties.length ? <div className="space-y-3 text-sm"><p>A sales pack needs a PDF template and a property.</p><Link className="block text-primary underline" href="/storage?tab=templates">Open templates in Library</Link><Link className="block text-primary underline" href="/properties">Open properties</Link></div> : result ? <div className="space-y-3 text-sm" role="status"><p>{result.error ?? (result.sent > 0 ? (result.demo ? "Demo sales pack saved. No message was delivered." : "Sales pack sent.") : "The pack could not be sent. Please check the recipient and try again.")}</p>{result.recipients.some(r => r.needsTemplate) && <p className="text-xs text-foreground-muted">This recipient needs an approved WhatsApp message template outside the 24-hour conversation window.</p>}<button className={field} onClick={() => { setResult(null); setPreview(null); }}>Back to pack</button></div> : <div className="space-y-3">
        <label className="block text-xs font-medium">Template<select className={`${field} mt-1`} value={templateId} disabled={pending} onChange={e => { setTemplateId(e.target.value); setPreview(null); }}>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="block text-xs font-medium">Property<select className={`${field} mt-1`} value={propertyId} disabled={pending} onChange={e => { setPropertyId(e.target.value); setPreview(null); }}><option value="">Choose property…</option>{properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label className="block text-xs font-medium">Message (optional)<textarea rows={2} className={`${field} mt-1`} value={caption} disabled={pending} onChange={e => setCaption(e.target.value)} placeholder="Here are the details of the property we discussed…" /></label>
        {preview && !preview.error && <section aria-label="Sales pack contents" className="max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-muted/30 p-4"><p className="text-xs font-semibold text-primary">{preview.agentName} · PROPERTY BROCHURE</p><h3 className="mt-2 text-base font-semibold">{preview.title}</h3><p className="mt-1 font-semibold text-primary">{preview.price}</p><p className="mt-1 text-xs text-foreground-muted">{preview.specs} · {preview.area}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm">{preview.body}</p><a className="mt-3 inline-block text-xs text-primary underline" href={pdf} target="_blank" rel="noreferrer">Open generated PDF</a></section>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2"><button className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50" disabled={!templateId || !propertyId || pending || previewing} onClick={() => startPreview(async () => { setError(""); try { const result = await previewConversationPack(templateId, propertyId); if (result.error) setError(result.error); else setPreview(result); } catch { setError("Could not preview this pack. Please try again."); } })}>{previewing ? "Preparing preview…" : "Preview pack"}</button><button className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!preview || pending || previewing} onClick={send}>{pending ? "Preparing pack…" : demo ? "Simulate send" : "Send sales pack"}</button></div>
      </div>}
    </Modal>}
  </>;
}
