"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function MessageScrollArea({ children, lastId }: { children: ReactNode; lastId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => { const el = ref.current; if (el) { el.scrollTop = el.scrollHeight; stick.current = true; } }, [lastId]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => { if (stick.current) el.scrollTop = el.scrollHeight; });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} onScroll={() => { const el = ref.current; if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} className="kf-thread-messages space-y-2 p-3 md:px-5" role="log" aria-label="Message history">{children}</div>;
}
