import Link from "next/link";
import { notFound } from "next/navigation";
import AppChrome from "@/components/AppChrome";
import StatusBadge from "@/components/StatusBadge";
import { isBranchLeader, isSuperAdmin } from "@/lib/access-control";
import { memberCategoryOptions } from "@/lib/member-options";
import { labelForMemberStatus } from "@/lib/registration-options";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canViewMemberProfile } from "@/lib/scope-permissions";
import MemberDetailEditor from "./MemberDetailEditor";

function labelForCategory(value: string | null) {
  return memberCategoryOptions.find((item) => item.value === value)?.label || "-";
}

function divisionSummary(userDivisions: Array<{
  division: { name: string; indonesianName: string; chineseName: string };
  subdivision: { name: string; indonesianName: string; chineseName: string } | null;
}>) {
  if (!userDivisions.length) return ["Belum ada divisi"];
  const groups = new Map<string, { label: string; subdivisions: string[] }>();
  for (const item of userDivisions) {
    const key = item.division.name;
    const current = groups.get(key) || {
      label: `${item.division.name} - ${item.division.indonesianName} / ${item.division.chineseName}`,
      subdivisions: [],
    };
    if (item.subdivision) current.subdivisions.push(`${item.subdivision.name} - ${item.subdivision.indonesianName} / ${item.subdivision.chineseName}`);
    groups.set(key, current);
  }
  return [...groups.values()].map((group) => group.subdivisions.length ? `${group.label}: ${group.subdivisions.join(", ")}` : group.label);
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  const roles = currentUser?.systemRoles.map((role) => role.role) || [];
  const { id } = await params;

  const [member, viewerPengawas, branches, classLevels] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        homeBranch: true,
        currentClass: true,
        systemRoles: true,
        userDivisions: { include: { division: true, subdivision: true } },
        eventParticipants: {
          include: {
            event: {
              include: {
                hostingBranch: true,
                attendances: { where: { userId: id } },
                feedbacks: { where: { userId: id } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    currentUser
      ? prisma.eventParticipant.findMany({
          where: { userId: currentUser.id, role: "PENGAWAS", registrationStatus: "APPROVED" },
          select: { eventId: true },
        })
      : [],
    prisma.branch.findMany({ orderBy: [{ isCenter: "desc" }, { name: "asc" }] }),
    prisma.classLevel.findMany({ orderBy: { levelNumber: "asc" } }),
  ]);

  if (!member) notFound();

  const canView = canViewMemberProfile(currentUser, member, viewerPengawas.map((item) => item.eventId));
  const canEdit = Boolean(currentUser && (isSuperAdmin(roles) || (isBranchLeader(roles) && currentUser.homeBranchId === member.homeBranchId)));

  if (!canView) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Akses ditolak</h1>
          <p className="mt-2 text-sm text-neutral-500">Kamu hanya bisa melihat profil sendiri atau anggota dalam scope yang diizinkan.</p>
        </section>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <div className="space-y-6">
        <section className="surface rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Member detail</p>
              <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">{member.fullName}</h1>
              <p className="mt-1 text-sm text-neutral-500">{member.chineseName || "Nama Mandarin belum diisi"}</p>
            </div>
            <StatusBadge value={member.status} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Email<br /><strong>{member.email}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">HP<br /><strong>{member.phone || "-"}</strong></div>
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Cabang<br /><strong>{member.homeBranch.name}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Kelas<br /><strong>{member.currentClass?.name || "-"}</strong></div>
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Status anggota<br /><strong>{labelForMemberStatus(member.memberStatus)}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Kategori<br /><strong>{labelForCategory(member.memberCategory)}</strong></div>
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Credit<br /><strong>{member.creditBalance}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">System role<br /><strong>{member.systemRoles.map((role) => role.role).join(", ") || "MEMBER"}</strong></div>
          </div>

          <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="font-semibold text-[#1f1f1f]">Divisi & sub-divisi</h2>
            <div className="mt-3 space-y-2">
              {divisionSummary(member.userDivisions).map((item) => (
                <p key={item} className="rounded-md bg-[#fff7e8] px-3 py-2 text-sm text-neutral-700">{item}</p>
              ))}
            </div>
          </div>
        </section>

        {canEdit ? (
          <MemberDetailEditor
            userId={member.id}
            defaultValues={{
              status: member.status,
              memberStatus: member.memberStatus,
              memberCategory: member.memberCategory,
              homeBranchId: member.homeBranchId,
              currentClassId: member.currentClassId,
            }}
            branches={branches}
            classLevels={classLevels}
          />
        ) : null}

        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Activity history</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-[#fff7e8] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Feedback</th>
                  <th className="px-4 py-3">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {member.eventParticipants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-4 py-3">
                      <Link className="font-semibold text-[#1f1f1f] underline" href={`/events/${participant.eventId}`}>{participant.event.title}</Link>
                      <p className="text-xs text-neutral-500">{participant.event.hostingBranch.name}</p>
                    </td>
                    <td className="px-4 py-3">{participant.role}</td>
                    <td className="px-4 py-3">{participant.registrationStatus}</td>
                    <td className="px-4 py-3">{participant.event.attendances[0]?.status || participant.attendanceStatus}</td>
                    <td className="px-4 py-3">{participant.feedbackSubmitted || participant.event.feedbacks.length ? "Submitted" : "Belum"}</td>
                    <td className="px-4 py-3">-</td>
                  </tr>
                ))}
                {member.eventParticipants.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-neutral-500" colSpan={6}>Belum ada aktivitas event.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppChrome>
  );
}
