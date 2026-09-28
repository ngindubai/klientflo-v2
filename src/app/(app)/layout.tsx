import { AppShell } from "@/components/layout/app-shell";
import { getCurrentAgent } from "@/server/agent";
import { isWhatsAppConfigured } from "@/server/whatsapp";

// The authenticated section is always server-rendered: it depends on the
// session + database on every request, so nothing here should be statically
// prerendered at build time (when the DB may be empty/unmigrated). This
// cascades to all nested routes.
export const dynamic = "force-dynamic";

// Shared shell for all authenticated app sections: sidebar navigation plus the
// persistent global AI command bar in the top bar.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agent = await getCurrentAgent();
  return <AppShell agentName={agent.name} demo={!isWhatsAppConfigured()}>{children}</AppShell>;
}
