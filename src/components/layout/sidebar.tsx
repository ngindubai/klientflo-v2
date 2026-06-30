"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { NavIcon } from "@/components/nav-icon";
import { BrandLogo } from "@/components/brand-logo";
import { logout } from "@/server/auth";
import { cn } from "@/lib/utils";

export function Sidebar({
  mobileOpen,
  onClose,
  agentName,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  agentName: string;
}) {
  const pathname = usePathname();
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
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard">
            <BrandLogo size="md" />
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
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-muted font-semibold text-accent">
              {initials || "K"}
            </span>
            <div className="min-w-0 flex-1">
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
