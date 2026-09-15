import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import SettingsPageHeader from "../SettingsPageHeader";

export default async function ActivitySettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Ringkasan</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  const [fullUser, joinedEventsCount, feedbackSubmittedCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, include: { currentClass: true } }),
    prisma.eventParticipant.count({ where: { userId: user.id, registrationStatus: "APPROVED" } }),
    prisma.feedback.count({ where: { userId: user.id } }),
  ]);

  return (
    <AppChrome>
      <div className="mx-auto max-w-xl">
        <SettingsPageHeader title="Ringkasan" />
        <div className="surface grid grid-cols-2 gap-3 rounded-lg p-5">
          <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Credit<br /><strong>{fullUser?.creditBalance ?? 0}</strong></div>
          <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Kelas<br /><strong>{fullUser?.currentClass?.name || "-"}</strong></div>
          <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Event diikuti<br /><strong>{joinedEventsCount}</strong></div>
          <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Feedback dikirim<br /><strong>{feedbackSubmittedCount}</strong></div>
        </div>
      </div>
    </AppChrome>
  );
}
