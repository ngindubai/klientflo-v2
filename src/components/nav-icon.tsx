import {
  LayoutDashboard,
  Inbox,
  Users,
  Briefcase,
  TrendingUp,
  Building2,
  KeyRound,
  KanbanSquare,
  BarChart3,
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
  agents: Briefcase,
  investors: TrendingUp,
  properties: Building2,
  owners: KeyRound,
  pipeline: KanbanSquare,
  reports: BarChart3,
  calendar: CalendarDays,
  documents: FileText,
  settings: Settings,
};

export function NavIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon {...props} />;
}
