import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  MessageSquareText,
  QrCode,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { canAccess } from "@/lib/access-control";
import { dictionary, type Locale } from "@/lib/i18n";
import type { Workspace } from "@/lib/workspace";

export const appNavItems = [
  { href: "/dashboard", labelKey: "home", icon: Home, action: "viewEvents", workspaces: ["MEMBER", "SPEAKER", "TRAINER", "ADMIN"] },
  { href: "/members", labelKey: "members", icon: Users, action: "viewAllMembers", workspaces: ["ADMIN"] },
  { href: "/user/events", labelKey: "events", icon: CalendarDays, action: "viewEvents", workspaces: ["MEMBER"] },
  { href: "/user/classes", labelKey: "myClass", icon: BookOpen, action: "viewEvents", workspaces: ["MEMBER"] },
  { href: "/user/training", labelKey: "training", icon: Store, action: "viewEvents", workspaces: ["MEMBER"] },
  { href: "/user/activity", labelKey: "activity", icon: MessageSquareText, action: "viewEvents", workspaces: ["MEMBER"] },
  { href: "/user/store", labelKey: "store", icon: Store, action: "viewEvents", workspaces: ["MEMBER"] },
  { href: "/events?domain=dharma", labelKey: "sidangDharma", icon: CalendarDays, action: "viewEvents", workspaces: ["SPEAKER", "TRAINER", "ADMIN"] },
  { href: "/events?domain=training", labelKey: "trainingAdmin", icon: Store, action: "viewEvents", workspaces: ["TRAINER", "ADMIN"] },
  { href: "/classes", labelKey: "classBanWuCu", icon: BookOpen, action: "viewEvents", workspaces: ["ADMIN"] },
  { href: "/approvals", labelKey: "approval", icon: ClipboardCheck, action: "manageEventParticipants", workspaces: ["ADMIN"] },
  { href: "/attendance", labelKey: "attendance", icon: QrCode, action: "manageAttendance", workspaces: ["ADMIN"] },
  { href: "/feedback", labelKey: "feedback", icon: BarChart3, action: "viewEvents", workspaces: ["SPEAKER", "TRAINER", "ADMIN"] },
  { href: "/materials", labelKey: "materials", icon: FileText, action: "viewEvents", workspaces: ["SPEAKER", "TRAINER", "ADMIN"] },
  { href: "/admin/wejangan", labelKey: "adminWejangan", icon: Sparkles, action: "editEvent", workspaces: ["ADMIN"] },
  { href: "/admin/rewards", labelKey: "adminRewards", icon: Store, action: "editEvent", workspaces: ["ADMIN"] },
  { href: "/admin/activity", labelKey: "activityMonitor", icon: MessageSquareText, action: "editEvent", workspaces: ["ADMIN"] },
] as const;

export function visibleNavItems(roles: string[], workspace: Workspace = "ADMIN", locale: Locale = "id") {
  return appNavItems.filter((item) => {
    const access = canAccess(roles, item.action);
    return (access === "allow" || access === "partial") && (item.workspaces as readonly string[]).includes(workspace);
  }).map((item) => ({
    ...item,
    label: dictionary[locale].nav[item.labelKey],
  }));
}
