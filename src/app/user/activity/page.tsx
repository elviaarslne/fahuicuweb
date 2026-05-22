import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import ActivityFeedClient from "./ActivityFeedClient";

export default async function ActivityPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return <AppChrome><div className="rounded-3xl border border-[#e8ddc4] bg-white p-6">Silakan login dahulu.</div></AppChrome>;
  }
  if (currentUser.status !== "ACTIVE") {
    return <AppChrome><div className="rounded-3xl border border-[#e8ddc4] bg-white p-6">Activity hanya tersedia untuk akun aktif.</div></AppChrome>;
  }

  const [profile, postCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        homeBranch: true,
        currentClass: true,
        userDivisions: { include: { division: true, subdivision: true } },
      },
    }),
    prisma.activityPost.count({ where: { userId: currentUser.id, deletedAt: null } }),
  ]);

  if (!profile) {
    return <AppChrome><div className="rounded-3xl border border-[#e8ddc4] bg-white p-6">User tidak ditemukan.</div></AppChrome>;
  }

  return (
    <AppChrome>
      <ActivityFeedClient
        profile={{
          id: profile.id,
          fullName: profile.fullName,
          chineseName: profile.chineseName,
          email: profile.email,
          username: profile.username,
          bio: profile.bio,
          profilePhotoUrl: profile.profilePhotoUrl,
          homeBranch: profile.homeBranch?.name || "-",
          currentClass: profile.currentClass?.name || null,
          memberCategory: profile.memberCategory,
          divisions: profile.userDivisions.map((item) => item.subdivision?.name || item.division.name),
          postCount,
        }}
      />
    </AppChrome>
  );
}
