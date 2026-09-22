import Link from "next/link";
import { cookies } from "next/headers";
import { Bell, Settings, Star } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import SidebarNav from "@/components/SidebarNav";
import { normalizeLocale } from "@/lib/i18n";
import { visibleNavItems } from "@/lib/nav";
import { getCurrentUser, getDisplayTitle } from "@/lib/session";
import { availableWorkspaces, normalizeWorkspace } from "@/lib/workspace";

export default async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  const roles = user?.systemRoles.map((role) => role.role) ?? ["MEMBER"];
  const cookieStore = await cookies();
  const locale = normalizeLocale(user?.languagePreference);
  const workspace = normalizeWorkspace(cookieStore.get("fhc_workspace")?.value || user?.selectedWorkspace, roles);
  const navItems = visibleNavItems(roles, workspace, locale).map((item) => ({
    href: item.href,
    label: item.label,
    labelKey: item.labelKey,
  }));
  const displayName = user?.chineseName || user?.fullName || "Fa Hui Cu";
  const titleCn = getDisplayTitle(user);
  const credit = user?.creditBalance ?? 0;
  const canUseAdminSurface = roles.some((role) => ["SUPER_ADMIN", "ADMIN", "KETUA", "SUB_KETUA"].includes(role));
  const isMemberWorkspace = workspace === "MEMBER";

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#e8ddc4] bg-[#fffdf7]/90 backdrop-blur">
        <div className="shell flex min-h-14 items-center justify-between gap-4">
          <Link href="/dashboard" className="ml-10 flex items-center gap-3 lg:ml-0">
            {!isMemberWorkspace ? (
              <>
                <div className="grid size-10 place-items-center rounded-xl bg-[#1f1f1f] text-sm font-bold text-[#f4c62b]">FHC</div>
                <div>
                  <p className="text-sm font-semibold text-[#1f1f1f]">Fa Hui Cu</p>
                  <p className="text-xs text-[#6b6254]">{credit} credit pembelajaran</p>
                </div>
              </>
            ) : (
              <div className="text-sm font-black text-[#1f1f1f]" />
            )}
          </Link>

          <div className="flex items-center gap-2.5">
            {isMemberWorkspace ? (
              <Link
                href="/user/store"
                className="flex h-10 items-center gap-2 rounded-xl border border-[#e8ddc4] bg-[#fffdf7] px-3 text-[#1f1f1f] shadow-sm shadow-amber-900/5"
              >
                <span className="grid size-6 place-items-center rounded-full bg-[#f4c62b]/18 text-[#a17700]">
                  <Star size={14} />
                </span>
                <span className="leading-none">
                  <span className="block text-base font-black">{credit}</span>
                  <span className="block text-[11px] text-[#6b6254]">Credit</span>
                </span>
              </Link>
            ) : null}
            <Link
              href="/notifications"
              aria-label="Notifikasi"
              className="grid size-10 place-items-center rounded-full bg-[#fffdf7] text-[#1f1f1f] shadow-sm shadow-black/5 ring-1 ring-[#e8ddc4]"
            >
              <Bell size={18} />
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="grid size-10 place-items-center rounded-full bg-[#fffdf7] text-[#1f1f1f] shadow-sm shadow-black/5 ring-1 ring-[#e8ddc4]"
            >
              <Settings size={18} />
            </Link>
            <AccountMenu
              displayName={displayName}
              email={user?.email}
              titleCn={titleCn}
              profilePhotoUrl={user?.profilePhotoUrl}
              activeWorkspace={workspace}
              workspaces={availableWorkspaces(roles)}
            />
          </div>
        </div>
      </header>

      <div className={`shell grid gap-6 py-6 ${isMemberWorkspace ? "lg:grid-cols-[auto_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <SidebarNav
          navItems={navItems}
          isMemberWorkspace={isMemberWorkspace}
          canUseAdminSurface={canUseAdminSurface && !isMemberWorkspace}
          displayName={displayName}
          email={user?.email}
          profilePhotoUrl={user?.profilePhotoUrl}
        />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
