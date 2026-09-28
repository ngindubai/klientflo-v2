"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandBar } from "@/components/ai/command-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  agentName,
  demo,
}: {
  children: React.ReactNode;
  agentName: string;
  demo: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const inbox = usePathname() === "/inbox";
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => document.documentElement.style.setProperty("--app-height", `${viewport?.height ?? window.innerHeight}px`);
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => { viewport?.removeEventListener("resize", resize); window.removeEventListener("resize", resize); };
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if(e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <div className={cn("flex min-h-dvh", inbox && "h-[var(--app-height,100dvh)] min-h-0 overflow-hidden")}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        agentName={agentName}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />

      <div inert={mobileOpen} className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top bar with the persistent global AI command bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2 md:gap-3 md:px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <CommandBar />
          {demo && <span className="hidden shrink-0 rounded-md bg-surface-muted px-2 py-1 text-[11px] text-foreground-muted md:inline">Demo · disconnected</span>}
          <ThemeToggle />
        </header>

        <main className={cn("min-h-0 min-w-0 flex-1", inbox ? "overflow-hidden p-0" : "px-3 py-5 md:px-6")}>
          {!inbox && <WorkspaceTabs />}
          {children}
        </main>
      </div>
    </div>
  );
}
