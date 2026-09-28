"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_GROUPS } from "@/lib/constants";
import { NavIcon } from "@/components/nav-icon";
import { BrandLogo } from "@/components/brand-logo";
import { logout } from "@/server/auth";
import { cn } from "@/lib/utils";

export function Sidebar({
  mobileOpen,
  onClose,
  agentName,
  collapsed,
  onCollapse,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  agentName: string;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Close menu"]')?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [mobileOpen]);
  const initials = agentName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        ref={menuRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
        aria-label={mobileOpen ? "Navigation menu" : undefined}
        onKeyDown={e => {
          if (!mobileOpen || e.key !== "Tab") return;
          const controls = [...(menuRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? [])].filter(el => el.getClientRects().length);
          const first = controls[0], last = controls.at(-1);
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface lg:sticky lg:top-0 lg:flex",
          mobileOpen ? "flex" : "hidden",
          collapsed ? "lg:w-16" : "lg:w-44 xl:w-48",
        )}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center justify-between px-3">
          <Link href="/dashboard" onClick={onClose} aria-label="Klientflo home">
            <BrandLogo size="sm" markOnly={collapsed && !mobileOpen} />
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-4" aria-label="Main navigation">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className="space-y-1">
              {group.label && !collapsed && (
                <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-foreground-muted/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const grouped = (item.href === "/clients" && ["/clients", "/agents", "/investors", "/owners"].some(p=>pathname === p || pathname.startsWith(p+"/"))) ||
                  (item.href === "/documents" && pathname.startsWith("/storage")) ||
                  (item.href === "/opportunities" && pathname.startsWith("/pipeline"));
                const active = grouped ||
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      collapsed && !mobileOpen && "justify-center",
                      active
                        ? "bg-primary-muted text-primary"
                        : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    <NavIcon name={item.icon} className="size-4 shrink-0" />
                    {(!collapsed || mobileOpen) && item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Agent footer */}
        <div className="shrink-0 border-t border-border p-2">
          <button onClick={onCollapse} className="mb-2 hidden w-full items-center justify-center gap-2 rounded-lg p-2 text-xs text-foreground-muted hover:bg-surface-muted lg:flex" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
            {collapsed ? <PanelLeftOpen className="size-4"/> : <><PanelLeftClose className="size-4"/> Collapse menu</>}
          </button>
          <div className="flex flex-wrap items-center gap-2 px-1 py-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-muted font-semibold text-accent">
              {initials || "K"}
            </span>
            <div className={cn("min-w-0 flex-1", collapsed && !mobileOpen && "hidden")}>
              <p className="truncate text-sm font-medium">{agentName}</p>
              <p className="truncate text-xs text-foreground-muted">
                Real estate agent
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
