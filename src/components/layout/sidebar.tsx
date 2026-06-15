"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { NavIcon } from "@/components/nav-icon";
import { cn } from "@/lib/utils";

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

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
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
              K
            </span>
            <span className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
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
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-muted text-primary"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <NavIcon name={item.icon} className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Agent footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-muted font-semibold text-accent">
              S
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Sarah Al Mansoori</p>
              <p className="truncate text-xs text-foreground-muted">
                Real estate agent
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
