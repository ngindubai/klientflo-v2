"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const contacts = [
  ["Clients", "/clients"], ["Agents", "/agents"],
  ["Investors", "/investors"], ["Owners", "/owners"],
];
const library = [
  ["Documents", "/documents"], ["Sales pack templates", "/storage?tab=templates"],
  ["Floor plans", "/storage?tab=floorplans"], ["Videos", "/storage?tab=videos"],
];

export function WorkspaceTabs() {
  const path = usePathname();
  const params = useSearchParams();
  const isContacts = contacts.some(([,href]) => path === href || path.startsWith(href+"/"));
  const isLibrary = path === "/documents" || path.startsWith("/documents/") || path === "/storage";
  const isDeals = path === "/opportunities" || path === "/pipeline" || path.startsWith("/pipeline/");
  if (!isContacts && !isLibrary && !isDeals) return null;
  const current = path === "/storage" ? `/storage?tab=${params.get("tab") || "templates"}` : path;
  return <nav className="kf-workspace-tabs" aria-label={isContacts ? "Contact groups" : isDeals ? "Deal views" : "Library sections"}>
    {(isContacts ? contacts : isDeals ? [["Deal overview", "/opportunities"], ["Sales & rental pipeline", "/pipeline"]] : library).map(([label,href]) => <Link key={href} href={href}
      aria-current={current === href || (!href.includes("?") && path.startsWith(href+"/")) ? "page" : undefined}>{label}</Link>)}
  </nav>;
}
