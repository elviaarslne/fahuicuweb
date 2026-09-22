"use client";

import Link from "next/link";
import { BarChart3, BookOpen, CalendarClock, CalendarDays, ClipboardCheck, FileText, Gift, Home, Menu, MessageSquareText, QrCode, Settings, Sparkles, Store, Users, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; labelKey: string };

const iconMap = {
  home: Home,
  members: Users,
  classes: BookOpen,
  events: CalendarDays,
  sidangDharma: CalendarDays,
  trainingAdmin: Gift,
  classBanWuCu: BookOpen,
  approval: ClipboardCheck,
  attendance: QrCode,
  feedback: BarChart3,
  materials: FileText,
  myClass: BookOpen,
  schedule: CalendarClock,
  learningModules: FileText,
  dailyWejangan: Sparkles,
  training: Gift,
  activity: MessageSquareText,
  store: Store,
  settings: Settings,
  adminWejangan: Sparkles,
  adminModules: BookOpen,
  adminRewards: Store,
  adminActivity: MessageSquareText,
  activityMonitor: MessageSquareText,
} as const;

export default function SidebarNav({
  navItems,
  isMemberWorkspace,
  canUseAdminSurface,
  displayName,
  email,
  profilePhotoUrl,
}: {
  navItems: NavItem[];
  isMemberWorkspace: boolean;
  canUseAdminSurface: boolean;
  displayName: string;
  email?: string | null;
  profilePhotoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const sidebar = (
    <aside className={`h-full rounded-none border-r border-[#e8ddc4] bg-[#fff8e8]/95 p-4 shadow-2xl shadow-amber-950/5 backdrop-blur lg:min-h-[calc(100vh-104px)] lg:rounded-2xl lg:border lg:border-[#e8ddc4] ${collapsed ? "lg:w-[76px]" : "lg:w-[240px]"}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="hidden rounded-xl bg-[#fffdf7] p-2.5 text-[#1f1f1f] shadow-sm ring-1 ring-[#e8ddc4] transition hover:bg-[#f8f1de] lg:grid"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto rounded-xl bg-[#fffdf7] p-2.5 text-[#1f1f1f] shadow-sm ring-1 ring-[#e8ddc4] lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {isMemberWorkspace ? (
        <>
          <div className={`mb-5 rounded-xl border border-[#e8ddc4] bg-gradient-to-br from-[#fffdf7] via-[#fff8e8] to-[#f8f1de] p-4 shadow-sm shadow-amber-900/5 ${collapsed ? "hidden lg:block lg:p-2" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[#f4c62b]/20 text-[#a17700]">
                <Sparkles size={21} />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-sm font-black text-[#1f1f1f]">Fa Hui Cu</p>
                  <p className="mt-0.5 text-xs font-medium text-[#6b6254]">Learning Journey</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`mb-5 text-center ${collapsed ? "hidden lg:block" : ""}`}>
            <div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-[#fffdf7] shadow-sm ring-4 ring-[#f8f1de]">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <Users size={34} className="text-[#a17700]" />
              )}
            </div>
            {!collapsed ? (
              <>
                <p className="mt-3 truncate text-base font-black text-[#1f1f1f]">{displayName}</p>
                <p className="mt-1 truncate text-sm text-[#6b6254]">{email || "Email belum tersedia"}</p>
              </>
            ) : null}
          </div>
        </>
      ) : null}

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = iconMap[item.labelKey as keyof typeof iconMap] || Home;
          const itemPath = item.href.split("?")[0];
          const active = pathname === itemPath || (itemPath !== "/dashboard" && pathname.startsWith(itemPath));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#f4c62b]/18 text-[#1f1f1f] shadow-sm" : "text-[#1f1f1f]/78 hover:bg-[#f8f1de] hover:text-[#1f1f1f]"} ${collapsed ? "lg:justify-center lg:px-2" : ""}`}
              title={item.label}
            >
              <Icon size={19} />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {canUseAdminSurface && !collapsed ? (
        <div className="mt-5 rounded-lg bg-[#f8f1de] p-3 text-xs leading-5 text-[#6b6254]">
          <p className="font-semibold text-[#1f1f1f]">Admin end</p>
          <p className="mt-1">Menu mengikuti role, cabang, dan assignment operasional.</p>
        </div>
      ) : null}
    </aside>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-3 z-40 grid size-10 place-items-center rounded-full bg-[#fffdf7] text-[#1f1f1f] shadow-lg shadow-black/10 ring-1 ring-[#e8ddc4] lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={19} />
      </button>
      <div className="hidden lg:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#1f1f1f]/18 backdrop-blur-[2px]" type="button" onClick={() => setOpen(false)} aria-label="Close overlay" />
          <div className="relative h-full w-[292px] max-w-[88vw] transition-transform duration-200">{sidebar}</div>
        </div>
      ) : null}
    </>
  );
}
