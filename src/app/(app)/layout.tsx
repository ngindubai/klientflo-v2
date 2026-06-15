import { AppShell } from "@/components/layout/app-shell";

// Shared shell for all authenticated app sections: sidebar navigation plus the
// persistent global AI command bar in the top bar.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
