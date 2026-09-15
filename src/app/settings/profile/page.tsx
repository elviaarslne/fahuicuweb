import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import SettingsPageHeader from "../SettingsPageHeader";
import ProfileForm from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Profil</h1>
          <p className="mt-2 text-sm text-neutral-500">Silakan login untuk mengatur akun.</p>
        </section>
      </AppChrome>
    );
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      homeBranch: true,
      currentClass: true,
      userDivisions: { include: { division: true, subdivision: true } },
    },
  });

  if (!fullUser) return null;

  return (
    <AppChrome>
      <div className="mx-auto max-w-xl">
        <SettingsPageHeader title="Profil" />
        <ProfileForm
          user={{
            fullName: fullUser.fullName,
            chineseName: fullUser.chineseName,
            phone: fullUser.phone,
            email: fullUser.email,
            homeBranch: fullUser.homeBranch,
            currentClass: fullUser.currentClass,
            memberStatus: fullUser.memberStatus,
            memberCategory: fullUser.memberCategory,
            userDivisions: fullUser.userDivisions,
          }}
        />
      </div>
    </AppChrome>
  );
}
