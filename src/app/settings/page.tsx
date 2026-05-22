import { cookies } from "next/headers";
import AppChrome from "@/components/AppChrome";
import { dictionary, normalizeLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { availableWorkspaces, normalizeWorkspace } from "@/lib/workspace";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Settings</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  const [fullUser, joinedEventsCount, feedbackSubmittedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        homeBranch: true,
        currentClass: true,
        userDivisions: { include: { division: true, subdivision: true } },
      },
    }),
    prisma.eventParticipant.count({ where: { userId: user.id, registrationStatus: "APPROVED" } }),
    prisma.feedback.count({ where: { userId: user.id } }),
  ]);

  const roles = user.systemRoles.map((role) => role.role);
  const locale = normalizeLocale(user.languagePreference);
  const workspace = normalizeWorkspace((await cookies()).get("fhc_workspace")?.value || user.selectedWorkspace, roles);
  const t = dictionary[locale].settings;

  return (
    <AppChrome>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
          Pengaturan akun pribadi, bahasa, privasi, workspace, dan ringkasan aktivitas belajar.
        </p>

        {fullUser ? (
          <SettingsClient
            user={{
              id: fullUser.id,
              fullName: fullUser.fullName,
              chineseName: fullUser.chineseName,
              email: fullUser.email,
              phone: fullUser.phone,
              profilePhotoUrl: fullUser.profilePhotoUrl,
              qiuDaoCardUrl: fullUser.qiuDaoCardUrl,
              homeBranch: fullUser.homeBranch,
              currentClass: fullUser.currentClass,
              memberStatus: fullUser.memberStatus,
              memberCategory: fullUser.memberCategory,
              creditBalance: fullUser.creditBalance,
              language: locale,
              journalVisibility: fullUser.journalVisibility,
              userDivisions: fullUser.userDivisions,
            }}
            workspaces={availableWorkspaces(roles)}
            activeWorkspace={workspace}
            joinedEventsCount={joinedEventsCount}
            feedbackSubmittedCount={feedbackSubmittedCount}
            labels={t}
          />
        ) : null}
      </section>
    </AppChrome>
  );
}
