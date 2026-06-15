import {
  LayoutDashboard,
  Inbox,
  Users,
  Building2,
  KanbanSquare,
  CalendarDays,
  FileText,
  Settings,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

// Maps the icon keys used in NAV_ITEMS (constants.ts) to lucide components.
const ICONS: Record<string, ComponentType<LucideProps>> = {
  dashboard: LayoutDashboard,
  inbox: Inbox,
  clients: Users,
  properties: Building2,
  pipeline: KanbanSquare,
  calendar: CalendarDays,
  documents: FileText,
  settings: Settings,
};

export function NavIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon {...props} />;
}
