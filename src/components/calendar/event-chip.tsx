import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { humanizeEnum } from "@/lib/constants";

// Chip colours per event type.
export const EVENT_COLORS: Record<string, string> = {
  viewing: "bg-primary-muted text-primary",
  office_meeting: "bg-accent-muted text-accent",
  trustee_office_meeting: "bg-urgency-5/10 text-urgency-5",
  contract_signing: "bg-urgency-3/10 text-urgency-3",
  handover: "bg-accent-muted text-accent",
  follow_up: "bg-surface-muted text-foreground-muted",
};

type ChipEvent = {
  id: string;
  type: string;
  title: string;
  startsAt: Date;
};

export function EventChip({
  event,
  compact,
}: {
  event: ChipEvent;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/calendar/${event.id}/edit`}
      title={`${formatTime(event.startsAt)} · ${humanizeEnum(event.type)} · ${event.title}`}
      className={cn(
        "block truncate rounded px-1.5 py-0.5 text-xs font-medium hover:opacity-80",
        EVENT_COLORS[event.type] ?? "bg-surface-muted text-foreground-muted",
      )}
    >
      {compact ? (
        <>
          <span className="tabular-nums">{formatTime(event.startsAt)}</span>{" "}
          {event.title}
        </>
      ) : (
        <div>
          <span className="tabular-nums">{formatTime(event.startsAt)}</span>
          <span className="ml-1">{event.title}</span>
        </div>
      )}
    </Link>
  );
}
