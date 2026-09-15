import {
  AlertTriangle,
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  MessageSquareText,
  PenLine,
  QrCode,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import AppChrome from "@/components/AppChrome";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { branchScopedWhere, getRoleNames, userScopedWhere } from "@/lib/branch-scope";
import { average } from "@/lib/feedback-options";
import { jakartaDayBoundsUtc } from "@/lib/jakarta-time";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeWorkspace } from "@/lib/workspace";
import ApprovalQueue from "./ApprovalQueue";

function dashboardScopeLabel(user: Awaited<ReturnType<typeof getCurrentUser>>, roles: string[]) {
  if (roles.includes("SUPER_ADMIN")) return "Semua cabang";
  if (roles.includes("TRAINER") || roles.includes("SPEAKER")) return "Event yang ditangani";
  return user?.homeBranch ? `${user.homeBranch.name} - ${user.homeBranch.foThangName}` : "Cabang sendiri";
}

function formatJakartaDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatJakartaTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function InternalDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Login diperlukan</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">Dashboard internal</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Silakan login untuk melihat data multi-branch sesuai hak akses.</p>
        </section>
      </AppChrome>
    );
  }

  const roles = getRoleNames(user);
  const workspace = normalizeWorkspace((await cookies()).get("fhc_workspace")?.value || user.selectedWorkspace, roles);
  const canUseLeader = roles.some((role) => ["SUPER_ADMIN", "ADMIN", "KETUA", "SUB_KETUA"].includes(role));
  const canUseTrainer = roles.some((role) => ["TRAINER", "SPEAKER"].includes(role));
  const isLeader = workspace === "ADMIN" && canUseLeader;
  const isTrainer = ["TRAINER", "SPEAKER"].includes(workspace) && canUseTrainer;
  const eventWhere = isLeader || isTrainer
    ? branchScopedWhere(user)
    : { participants: { some: { userId: user.id } } };
  const memberWhere = userScopedWhere(user);
  const { start: todayStart, end: todayEnd } = jakartaDayBoundsUtc();

  const [
    branches,
    totalMembers,
    pendingUsers,
    events,
    feedbacks,
    pendingCrossBranch,
    availableEvents,
    myParticipants,
    feedbackTodo,
    todayWejangan,
    todayEvents,
    pendingTopicFeedbackCount,
    pendingEventReflectionCount,
  ] = await Promise.all([
    prisma.branch.findMany({
      orderBy: [{ isCenter: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { users: true, events: true } },
      },
    }),
    prisma.user.count({ where: { status: "ACTIVE", ...memberWhere } }),
    prisma.user.count({ where: { status: "PENDING", ...memberWhere } }),
    prisma.event.findMany({
      where: eventWhere,
      orderBy: { startAt: "desc" },
      take: 6,
      include: {
        hostingBranch: true,
        targetClass: true,
        attendances: true,
        feedbacks: true,
        _count: { select: { participants: true, feedbacks: true } },
      },
    }),
    prisma.feedback.findMany({
      where: {
        event: eventWhere,
      },
      include: {
        event: { include: { hostingBranch: true } },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    isLeader
      ? prisma.eventParticipant.count({
          where: {
            registrationStatus: "PENDING_APPROVAL",
            event: roles.includes("SUPER_ADMIN") ? undefined : { hostingBranchId: user.homeBranchId },
          },
        })
      : 0,
    prisma.event.findMany({
      where: {
        status: { in: ["PUBLISHED", "REGISTRATION_OPEN"] },
        participants: { none: { userId: user.id, role: "ATTENDEE" } },
      },
      include: { hostingBranch: true, targetClass: true, _count: { select: { participants: true } } },
      orderBy: { startAt: "asc" },
      take: 4,
    }),
    prisma.eventParticipant.findMany({
      where: { userId: user.id },
      include: {
        event: {
          include: {
            hostingBranch: true,
            targetClass: true,
            attendances: true,
            feedbacks: { where: { userId: user.id } },
            _count: { select: { participants: true, feedbacks: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.eventParticipant.count({
      where: {
        userId: user.id,
        registrationStatus: "APPROVED",
        feedbackSubmitted: false,
        event: { status: "FEEDBACK_COLLECTION" },
      },
    }),
    prisma.dailyWejangan.findFirst({
      where: { uploadDate: { gte: todayStart, lte: todayEnd } },
      include: { reflections: { where: { userId: user.id } } },
      orderBy: { uploadDate: "desc" },
    }),
    prisma.event.findMany({
      where: {
        startAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        participants: { some: { userId: user.id, registrationStatus: "APPROVED" } },
      },
      include: { hostingBranch: true, participants: { where: { userId: user.id } } },
      orderBy: { startAt: "asc" },
      take: 3,
    }),
    prisma.eventSession.count({
      where: {
        event: {
          participants: { some: { userId: user.id, registrationStatus: "APPROVED" } },
          status: { in: ["COMPLETED", "FEEDBACK_COLLECTION"] },
        },
        topicFeedbacks: { none: { userId: user.id } },
      },
    }),
    prisma.eventParticipant.count({
      where: {
        userId: user.id,
        registrationStatus: "APPROVED",
        event: {
          status: { in: ["COMPLETED", "FEEDBACK_COLLECTION"] },
          eventReflections: { none: { userId: user.id } },
        },
      },
    }),
  ]);

  const activeEvents = events.filter((event) => ["PUBLISHED", "REGISTRATION_OPEN", "ONGOING"].includes(event.status)).length;
  const alreadyReflectedToday = Boolean(todayWejangan?.reflections.length);

  if (!isLeader && !isTrainer) {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const mySchedule = [
      ...todayEvents,
      ...myParticipants.map((item) => item.event),
      ...availableEvents,
    ]
      .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
      .filter((event) => event.startAt >= todayStart && event.startAt <= twoWeeksFromNow)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
      .slice(0, 5);

    return (
      <AppChrome>
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e8ddc4] bg-gradient-to-br from-[#fffdf7] via-[#fff8e8] to-[#f8f1de] p-5 shadow-lg shadow-amber-950/5 md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 gap-5">
                <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#f4c62b] text-white shadow-md shadow-[#e8b923]/25 md:size-20">
                  <Sparkles size={34} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h1 className="text-xl font-black text-[#1f1f1f] md:text-2xl">Wejangan Hari Ini</h1>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#6b6254]">
                      <CalendarDays size={15} />
                      {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}
                    </span>
                  </div>
                  {todayWejangan ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-[#6b6254]">{todayWejangan.source || "Sumber internal"}</p>
                      <p className="mt-3 line-clamp-2 text-base leading-7 text-[#1f1f1f]/80">“{todayWejangan.content}”</p>
                      <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#a17700]">
                        <Sparkles size={16} />
                        {alreadyReflectedToday ? "Refleksi hari ini sudah dikirim." : `Isi refleksi untuk mendapatkan ${todayWejangan.creditReward} credit`}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-base leading-7 text-[#1f1f1f]/70">Belum ada wejangan untuk hari ini.</p>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <Link href="/user/wejangan" className="btn-primary inline-flex px-5 py-2.5 text-sm font-bold">
                  {todayWejangan ? "Baca Wejangan" : "Lihat wejangan sebelumnya"}
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link href="/user/classes" className="group rounded-2xl border border-[#e8ddc4] bg-gradient-to-br from-[#fffdf7] to-[#f8f1de] p-5 shadow-sm shadow-amber-950/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-950/10">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[#f4c62b]/16 text-[#a17700]">
                  <BookOpenText size={22} />
                </div>
                <ChevronRight className="mt-8 text-[#1f1f1f]/70 transition group-hover:translate-x-1" size={20} />
              </div>
              <p className="mt-6 text-2xl font-black leading-tight text-[#1f1f1f]">{user.currentClass?.name || "Kelas belum ditentukan"}</p>
            </Link>
            <Link href="/notifications" className="group rounded-2xl border border-[#d5eadf] bg-gradient-to-br from-[#fffdf7] to-[#eef8f3] p-5 shadow-sm shadow-amber-950/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-950/10">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[#2e7d61]/15 text-[#2e7d61]">
                  <MessageSquareText size={22} />
                </div>
                <ChevronRight className="mt-8 text-[#1f1f1f]/70 transition group-hover:translate-x-1" size={20} />
              </div>
              <p className="mt-6 text-3xl font-black text-[#1f1f1f]">{pendingTopicFeedbackCount}</p>
              <p className="mt-1 text-base font-medium text-[#1f1f1f]">Feedback</p>
            </Link>
            <Link href="/notifications" className="group rounded-2xl border border-[#f7d6e7] bg-gradient-to-br from-[#fffdf7] to-[#fdf1f7] p-5 shadow-sm shadow-amber-950/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-950/10">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[#efa3c8]/24 text-[#b85283]">
                  <PenLine size={22} />
                </div>
                <ChevronRight className="mt-8 text-[#1f1f1f]/70 transition group-hover:translate-x-1" size={20} />
              </div>
              <p className="mt-6 text-3xl font-black text-[#1f1f1f]">{pendingEventReflectionCount}</p>
              <p className="mt-1 text-base font-medium text-[#1f1f1f]">Refleksi</p>
            </Link>
          </section>

          <section className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-lg shadow-amber-950/5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[#1f1f1f]">Jadwal Saya</h2>
              <Link href="/user/events" className="text-sm font-bold text-[#a17700] hover:text-[#1f1f1f]">Lihat semua</Link>
            </div>
            <div className="mt-4 divide-y divide-[#e8ddc4] overflow-hidden rounded-xl border border-[#e8ddc4] bg-white">
              {mySchedule.map((event) => (
                <Link key={event.id} href="/user/events" className="flex items-center justify-between gap-3 p-4 transition hover:bg-[#fff8e8]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1f1f1f]">{event.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b6254]">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} />{event.hostingBranch.name}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatJakartaDate(event.startAt)}, {formatJakartaTime(event.startAt)}</span>
                    </p>
                  </div>
                  <ChevronRight className="shrink-0 text-[#9aa7bd]" size={18} />
                </Link>
              ))}
              {mySchedule.length === 0 ? <p className="p-4 text-sm text-neutral-500">Belum ada acara dalam 2 minggu ke depan.</p> : null}
            </div>
          </section>
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#9a6a00]">Multi-Branch Dharma Learning</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-[#1f1f1f] md:text-4xl">Ringkasan operasional</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Scope: <strong>{dashboardScopeLabel(user, roles)}</strong>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLeader ? (
          <>
            <StatCard label="Total anggota aktif" value={`${totalMembers}`} detail="Mengikuti scope akses login" icon={Users} />
            <StatCard label="Pending users" value={`${pendingUsers}`} detail="Pendaftar perlu diterima/ditolak" icon={ClipboardCheck} />
            <StatCard label="Pending lintas cabang" value={`${pendingCrossBranch}`} detail="Menunggu approval Pengawas/Admin/Ketua" icon={AlertTriangle} />
            <StatCard label="Acara aktif" value={`${activeEvents}`} detail="Published, open, atau ongoing" icon={CalendarDays} />
          </>
        ) : (
          <>
            <StatCard label="Event saya" value={`${events.length}`} detail="Assigned sebagai trainer/speaker" icon={CalendarDays} />
            <StatCard label="Feedback masuk" value={`${feedbacks.length}`} detail="Dalam scope event saya" icon={BarChart3} />
            <StatCard label="Credit pembelajaran" value={`${user.creditBalance}`} detail="Credit pribadi" icon={Star} />
            <StatCard label="Feedback saya" value={`${feedbackTodo}`} detail="Perlu submit/edit" icon={ClipboardCheck} />
          </>
        )}
      </section>

      {isLeader ? <div className="mt-6"><ApprovalQueue /></div> : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#1f1f1f]">{isTrainer ? "Event yang saya pegang" : "Ringkasan acara"}</h2>
            <Link href="/events" className="text-sm font-bold text-[#9a6a00] hover:text-[#1f1f1f]">Lihat semua</Link>
          </div>
          <div className="mt-5 space-y-3">
            {events.slice(0, 4).map((event) => {
              const attended = event.attendances.filter((attendance) => ["PRESENT", "LATE"].includes(attendance.status)).length;
              const attendanceRate = event._count.participants ? Math.round((attended / event._count.participants) * 100) : 0;
              const purposeScore = average(event.feedbacks.map((feedback) => feedback.purposeAchievedRating));
              const belowTarget = event.minimumParticipants > 0 && event._count.participants < event.minimumParticipants;
              return (
                <div key={event.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">{event.title}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {event.hostingBranch.name} • {new Date(event.startAt).toLocaleDateString("id-ID")} • {event.targetClass?.name || "Semua kelas"}
                      </p>
                    </div>
                    <StatusBadge value={event.status} />
                  </div>
                  <p className={`mt-3 text-xs font-semibold ${belowTarget ? "text-amber-700" : "text-neutral-500"}`}>
                    Absensi {attendanceRate}% • Purpose {purposeScore ? `${purposeScore}/5` : "-"} • Peserta {event._count.participants}/{event.minimumParticipants || "-"} • Feedback {event._count.feedbacks}
                  </p>
                </div>
              );
            })}
            {events.length === 0 ? <p className="text-sm text-neutral-500">Belum ada event dalam scope ini.</p> : null}
          </div>
        </div>

        <div className="grid gap-6">
          {isLeader ? (
            <div className="surface rounded-lg p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1f1f1f]">Cabang / Fo Thang</h2>
                <Users className="text-[#9a6a00]" size={22} />
              </div>
              <div className="mt-4 space-y-2">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
                    <p className="text-sm font-semibold text-neutral-800">{branch.name}</p>
                    <p className="text-xs text-neutral-500">{branch._count.users} anggota • {branch._count.events} event</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="surface rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1f1f1f]">Evaluasi feedback</h2>
              <Link href="/feedback" className="text-sm font-bold text-[#9a6a00] hover:text-[#1f1f1f]">Lihat semua</Link>
            </div>
            <div className="mt-4 space-y-3">
              {feedbacks.slice(0, 3).map((feedback) => (
                <div key={feedback.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{feedback.event.title}</p>
                    <p className="text-xs text-neutral-500">{feedback.event.hostingBranch.name} • Purpose {feedback.purposeAchievedRating}/5</p>
                  </div>
                  {feedback.purposeAchievedRating < 3 ? (
                    <AlertTriangle className="shrink-0 text-amber-600" size={20} />
                  ) : (
                    <CheckCircle2 className="shrink-0 text-emerald-600" size={20} />
                  )}
                </div>
              ))}
              {feedbacks.length === 0 ? <p className="text-sm text-neutral-500">Belum ada feedback dalam scope ini.</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/attendance" className="surface block rounded-lg p-5 transition hover:bg-[#fff8e8]">
              <QrCode className="text-[#9a6a00]" size={24} />
              <h3 className="mt-3 font-semibold">QR attendance</h3>
              <p className="mt-1 text-sm text-neutral-500">Walk-in dan check-in peserta per cabang.</p>
            </Link>
            <Link href="/materials" className="surface block rounded-lg p-5 transition hover:bg-[#fff8e8]">
              <FileText className="text-[#9a6a00]" size={24} />
              <h3 className="mt-3 font-semibold">Materi</h3>
              <p className="mt-1 text-sm text-neutral-500">Kelola materi event dan kelas.</p>
            </Link>
          </div>
        </div>
      </section>
    </AppChrome>
  );
}
