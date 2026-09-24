import Link from "next/link";
import { notFound } from "next/navigation";
import AppChrome from "@/components/AppChrome";
import StatusBadge from "@/components/StatusBadge";
import {
  getAttendanceStatusLabel,
  getEventRoleLabel,
  getEventStatusLabel,
  getRegistrationStatusLabel,
  getSpeakerCategoryLabel,
} from "@/lib/event-options";
import { average } from "@/lib/feedback-options";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEventResource, canViewEventResource } from "@/lib/scope-permissions";
import EventSessionManager from "./EventSessionManager";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      hostingBranch: true,
      targetClass: true,
      participants: {
        include: {
          user: true,
        },
        orderBy: { createdAt: "asc" },
      },
      attendances: true,
      feedbacks: { include: { user: true } },
      materials: { include: { classLevel: true }, orderBy: { createdAt: "desc" } },
      sessions: {
        include: { speaker: true, trainer: true, topicFeedbacks: true },
        orderBy: [{ orderNumber: "asc" }, { startAt: "asc" }],
      },
    },
  });

  if (!event) notFound();

  const canView = canViewEventResource(currentUser, event);
  const canManage = canManageEventResource(currentUser, event);
  if (!canView) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-[#1f1f1f]">Akses ditolak</h1>
          <p className="mt-2 text-sm text-neutral-500">Detail event hanya tersedia untuk participant approved, trainer/speaker, atau pengurus sesuai scope.</p>
        </section>
      </AppChrome>
    );
  }

  const attendanceByUser = new Map(event.attendances.map((attendance) => [attendance.userId, attendance]));
  const feedbackByUser = new Map(event.feedbacks.map((feedback) => [feedback.userId, feedback]));
  const objective = average(event.feedbacks.flatMap((feedback) => [
    feedback.materialPurposeRating,
    feedback.deliveryClarityRating,
    feedback.timeEffectivenessRating,
    feedback.flowClarityRating,
  ]));
  const transformation = average(event.feedbacks.flatMap((feedback) => [
    feedback.perspectiveChangeRating,
    feedback.joinAgainRating,
    feedback.understandingRating,
  ]));
  const operational = average(event.feedbacks.flatMap((feedback) => [
    feedback.registrationEaseRating,
    feedback.coordinationClarityRating,
    feedback.locationComfortRating,
  ]));
  const presenters = event.participants.filter((participant) => ["TRAINER", "SPEAKER"].includes(participant.role));

  return (
    <AppChrome>
      <div className="space-y-6">
        <section className="surface rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Event detail</p>
              <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">{event.title}</h1>
              <p className="mt-1 text-sm text-neutral-500">{event.hostingBranch.name} • {event.targetClass?.name || "Semua kelas"} • {new Date(event.startAt).toLocaleString("id-ID")}</p>
            </div>
            <StatusBadge value={event.status} label={getEventStatusLabel(event.status)} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Peserta<br /><strong>{event.participants.length}/{event.minimumParticipants || "-"}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Feedback<br /><strong>{event.feedbacks.length}</strong></div>
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Materi<br /><strong>{event.materials.length}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">QR<br /><strong>{["REGISTRATION_OPEN", "ONGOING"].includes(event.status) ? "Active" : "Inactive"}</strong></div>
          </div>
          <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="font-semibold text-[#1f1f1f]">Purpose & expected outcome</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{event.purpose}</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">Expected: {event.expectedOutcome}</p>
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Participant list</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#fff7e8] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {event.participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-4 py-3">
                      <Link className="font-semibold underline" href={`/members/${participant.userId}`}>{participant.user.chineseName || participant.user.fullName}</Link>
                    </td>
                    <td className="px-4 py-3">
                      {getEventRoleLabel(participant.role)}
                      {participant.speakerCategory ? ` / ${getSpeakerCategoryLabel(participant.speakerCategory)}` : ""}
                    </td>
                    <td className="px-4 py-3">{getRegistrationStatusLabel(participant.registrationStatus)}</td>
                    <td className="px-4 py-3">{getAttendanceStatusLabel(attendanceByUser.get(participant.userId)?.status || participant.attendanceStatus)}</td>
                    <td className="px-4 py-3">{participant.feedbackSubmitted || feedbackByUser.has(participant.userId) ? "Submitted" : "Belum"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Sesi / topik event</h2>
          <div className="mt-4 space-y-3">
            {event.sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">{session.orderNumber}. {session.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {session.speaker?.chineseName || session.speaker?.fullName || "Speaker belum ditentukan"} • {session.trainer?.chineseName || session.trainer?.fullName || "Trainer belum ditentukan"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff7e8] px-3 py-1 text-xs font-bold text-[#9a6a00]">{session.topicFeedbacks.length} feedback</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{session.description || "Belum ada deskripsi sesi."}</p>
                {session.materialUrl ? <a href={session.materialUrl} target="_blank" className="mt-2 inline-flex text-sm font-bold text-[#9a6a00]">Buka materi sesi</a> : null}
              </div>
            ))}
            {event.sessions.length === 0 ? <p className="text-sm text-neutral-500">Belum ada sesi/topik untuk event ini.</p> : null}
          </div>
          {canManage ? <EventSessionManager eventId={event.id} /> : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="surface rounded-lg p-5">
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Feedback summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Objective<br /><strong>{objective ? `${objective}/5` : "-"}</strong></div>
              <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Transformation<br /><strong>{transformation ? `${transformation}/5` : "-"}</strong></div>
              <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Operational<br /><strong>{operational ? `${operational}/5` : "-"}</strong></div>
            </div>
            <div className="mt-4 space-y-2">
              {presenters.map((presenter) => (
                <div key={presenter.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
                  <strong>{presenter.user.chineseName || presenter.user.fullName}</strong>
                  <span className="text-neutral-500"> • {getEventRoleLabel(presenter.role)} • Summary event {event.feedbacks.length ? "tersedia" : "belum ada"}</span>
                </div>
              ))}
              {presenters.length === 0 ? <p className="text-sm text-neutral-500">Belum ada trainer/speaker di event ini.</p> : null}
            </div>
          </div>

          <div className="surface rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#1f1f1f]">Materi event</h2>
              {canManage ? <Link className="rounded-md bg-[#f4b63f] px-3 py-2 text-xs font-bold text-[#1f1f1f]" href="/materials">Kelola materi</Link> : null}
            </div>
            <div className="mt-4 space-y-3">
              {event.materials.map((material) => (
                <a key={material.id} href={material.fileUrl} target="_blank" className="block rounded-md border border-neutral-200 bg-white p-3 hover:bg-[#fff7e8]">
                  <p className="text-sm font-semibold text-[#1f1f1f]">{material.title}</p>
                  <p className="text-xs text-neutral-500">{material.type} • {material.classLevel?.name || "Semua kelas"}</p>
                </a>
              ))}
              {event.materials.length === 0 ? <p className="text-sm text-neutral-500">Belum ada materi untuk event ini.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </AppChrome>
  );
}
