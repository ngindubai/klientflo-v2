"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} aria-labelledby={titleId} className="kf-modal" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="mb-4 flex items-center justify-between gap-3"><h2 id={titleId} className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 hover:bg-surface-muted"><X className="size-5" /></button></div>{children}
  </dialog>;
}
