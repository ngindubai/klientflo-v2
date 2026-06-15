import { Bot } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ComingSoon } from "@/components/layout/coming-soon";
import { AiSettingsForm } from "@/components/settings/ai-settings-form";
import { getSettings } from "@/server/settings";
import type { AiSettingsInput } from "@/server/settings-actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  const initial: AiSettingsInput = {
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

  return (
    <>
      <PageHeader
        title="Settings"
        description="AI behaviour and quiet hours. WhatsApp, calendar and property sources arrive in Chunk 15."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Bot className="size-4 text-foreground-muted" />
            <h2 className="text-sm font-semibold">AI auto-reply & quiet hours</h2>
          </div>
          <div className="p-5">
            <AiSettingsForm initial={initial} />
          </div>
        </Card>

        <div className="lg:col-span-1">
          <ComingSoon chunk="Chunk 15 (WhatsApp, calendar, property sources)" />
        </div>
      </div>
    </>
  );
}
