import AppChrome from "@/components/AppChrome";
import { normalizeAccessRole } from "@/lib/access-control";
import { operationalEventRoles } from "@/lib/operational-permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import EventsEngine from "./EventsEngine";

export default async function EventsPage() {
  const user = await getCurrentUser();
  const roles = user?.systemRoles.map((role) => role.role) ?? [];

  let canAccessEventsAdmin = normalizeAccessRole(roles) !== "MEMBER";
  if (!canAccessEventsAdmin && user) {
    const assignedOperationalRole = await prisma.eventParticipant.findFirst({
      where: { userId: user.id, role: { in: [...operationalEventRoles] }, registrationStatus: "APPROVED" },
      select: { id: true },
    });
    canAccessEventsAdmin = Boolean(assignedOperationalRole);
  }

  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Sidang Dharma Admin</p>
        <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">Perencanaan Sidang Dharma</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Kelola draft, assignment operasional, publikasi, registrasi, absensi, dan feedback tanpa menampilkan draft ke user end.
        </p>
      </section>
      {canAccessEventsAdmin ? (
        <EventsEngine />
      ) : (
        <div className="mt-5 rounded-lg border border-neutral-200 bg-[#fff7e8] p-5 text-sm leading-6 text-neutral-600">
          Halaman ini hanya tersedia untuk Ketua, Sub-ketua, Admin, Super Admin, Trainer/Speaker, atau anggota yang sudah ditugaskan sebagai
          Koordinator, MC, atau Pengawas di suatu Sidang Dharma. Daftar Sidang Dharma yang kamu ikuti ada di halaman{" "}
          <a href="/user/events" className="font-semibold text-[#9a6a00] hover:underline">Event saya</a>.
        </div>
      )}
    </AppChrome>
  );
}
