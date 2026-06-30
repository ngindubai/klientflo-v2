import { Bot, SlidersHorizontal, Plug, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { AiSettingsForm } from "@/components/settings/ai-settings-form";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { TeamSettings } from "@/components/settings/team-settings";
import { getSettings } from "@/server/settings";
import { getTeamUsers } from "@/server/users";
import { isAIEnabled } from "@/server/ai/client";
import { isWhatsAppConfigured } from "@/server/whatsapp";
import { isSpeechConfigured } from "@/server/speech";
import { isS3Configured } from "@/server/storage";
import type { AiSettingsInput, GeneralSettingsInput } from "@/server/settings-actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [s, teamUsers] = await Promise.all([getSettings(), getTeamUsers()]);

  const aiInitial: AiSettingsInput = {
    aiAutoReplyEnabled: s.aiAutoReplyEnabled,
    aiApprovalMode: s.aiApprovalMode,
    aiTone: s.aiTone,
    followUpAutomation: s.followUpAutomation,
    viewingBookingAutomation: s.viewingBookingAutomation,
    newLeadAutomation: s.newLeadAutomation,
    quietHoursStart: s.quietHoursStart ?? "",
    quietHoursEnd: s.quietHoursEnd ?? "",
    quietHoursDays: s.quietHoursDays,
    quietHoursMessage: s.quietHoursMessage ?? "",
  };

  const generalInitial: GeneralSettingsInput = {
    whatsappBusinessNumber: s.whatsappBusinessNumber ?? "",
    workingHoursStart: s.workingHoursStart,
    workingHoursEnd: s.workingHoursEnd,
    viewingDuration: String(s.viewingDuration),
    meetingDuration: String(s.meetingDuration),
    bufferTime: String(s.bufferTime),
    brokerNumber: s.brokerNumber ?? "",
    refreshFrequency: s.refreshFrequency,
  };

  const integrations = [
    { label: "WhatsApp Business API", ok: isWhatsAppConfigured() },
    { label: "Anthropic Claude (AI)", ok: isAIEnabled() },
    { label: "Speech-to-text", ok: isSpeechConfigured() },
    { label: "AWS S3 storage", ok: isS3Configured() },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Configure your assistant, calendar and integrations." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="AI auto-reply & quiet hours" icon={Bot} className="lg:col-span-2">
          <AiSettingsForm initial={aiInitial} />
        </SectionCard>

        <Card className="h-fit">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Plug className="size-4 text-foreground-muted" />
            <h2 className="text-sm font-semibold">Integrations</h2>
          </div>
          <ul className="divide-y divide-border">
            {integrations.map((i) => (
              <li key={i.label} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{i.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    i.ok ? "bg-accent-muted text-accent" : "bg-surface-muted text-foreground-muted",
                  )}
                >
                  {i.ok ? "Connected" : "Not connected"}
                </span>
              </li>
            ))}
          </ul>
          <p className="px-4 py-3 text-xs text-foreground-muted">
            Set the matching environment variables to connect each service. The
            app runs in demo mode meanwhile.
          </p>
        </Card>

        <SectionCard title="WhatsApp, calendar & property sources" icon={SlidersHorizontal} className="lg:col-span-2">
          <GeneralSettingsForm initial={generalInitial} />
        </SectionCard>

        <SectionCard title="Team & access" icon={Users} className="lg:col-span-3">
          <TeamSettings users={teamUsers} />
        </SectionCard>
      </div>
    </>
  );
}

function SectionCard({
  title,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 text-foreground-muted" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
