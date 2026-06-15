import { AppShell } from "@/components/layout/app-shell";
import { getCurrentAgent } from "@/server/agent";

// Shared shell for all authenticated app sections: sidebar navigation plus the
// persistent global AI command bar in the top bar.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agent = await getCurrentAgent();
  return <AppShell agentName={agent.name}>{children}</AppShell>;
}
