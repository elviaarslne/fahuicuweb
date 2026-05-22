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

export default async function InternalDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ wejanganOffset?: string }> | { wejanganOffset?: string };
}) {
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
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const wejanganOffset = Math.max(0, Number(resolvedSearchParams.wejanganOffset || 0) || 0);

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
    pendingCrossBranchItems,
    feedbackActionItems,
    myMaterials,
    wejanganItems,
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
    prisma.eventParticipant.findMany({
      where: { userId: user.id, registrationStatus: "PENDING_APPROVAL" },
      include: { event: { include: { hostingBranch: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        registrationStatus: "APPROVED",
        event: { status: "FEEDBACK_COLLECTION" },
      },
      include: {
        event: {
          include: {
            hostingBranch: true,
            feedbacks: { where: { userId: user.id } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.material.findMany({
      where: {
        event: {
          participants: {
            some: { userId: user.id, registrationStatus: "APPROVED" },
          },
        },
      },
      include: { event: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.dailyWejangan.findMany({
      include: { reflections: { where: { userId: user.id } } },
      orderBy: { uploadDate: "desc" },
      skip: wejanganOffset,
      take: 2,
    }),
    prisma.event.findMany({
      where: {
        startAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
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
  const latestWejangan = wejanganItems[0] ?? null;
  const hasOlderWejangan = wejanganItems.length > 1;
  const previousWejanganHref = `/dashboard?wejanganOffset=${wejanganOffset + 1}`;
  const nextWejanganHref = wejanganOffset > 1 ? `/dashboard?wejanganOffset=${wejanganOffset - 1}` : "/dashboard";
  const totalCredit = await prisma.user.aggregate({
    where: memberWhere,
    _sum: { creditBalance: true },
  });
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  const upcomingSchedule = [
    ...myParticipants.map((item) => item.event),
    ...availableEvents,
  ]
    .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
    .filter((event) => event.startAt >= new Date() && event.startAt <= twoWeeksFromNow)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    .slice(0, 5);

  if (!isLeader && !isTrainer) {
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
                      {latestWejangan ? new Date(latestWejangan.uploadDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#6b6254]">{latestWejangan?.source || "Sumber internal"}</p>
                  <p className="mt-3 line-clamp-2 text-base leading-7 text-[#1f1f1f]/80">
                    {latestWejangan ? `“${latestWejangan.content}”` : "Belum ada wejangan harian."}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#a17700]">
                    <Sparkles size={16} />
                    Isi refleksi untuk mendapatkan {latestWejangan?.creditReward || 10} credit
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/user/wejangan" className="btn-primary inline-flex px-5 py-2.5 text-sm font-bold">Baca Wejangan</Link>
                  {hasOlderWejangan ? (
                    <Link href={previousWejanganHref} className="rounded-full border border-[#e8ddc4] bg-white px-4 py-2 text-sm font-bold text-[#2f405f] hover:bg-[#fff8e8]">
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-full border border-[#e8ddc4] bg-white/70 px-4 py-2 text-sm font-bold text-[#9aa7bd]">Previous</span>
                  )}
                  {wejanganOffset > 0 ? (
                    <Link href={nextWejanganHref} className="rounded-full border border-[#e8ddc4] bg-white px-4 py-2 text-sm font-bold text-[#2f405f] hover:bg-[#fff8e8]">
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-full border border-[#e8ddc4] bg-white/70 px-4 py-2 text-sm font-bold text-[#9aa7bd]">Next</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e8ddc4] bg-white p-5 shadow-sm shadow-amber-950/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9aa7bd]">Today&apos;s Task</p>
                <h2 className="mt-1 text-xl font-black text-[#1f1f1f]">Daily Task</h2>
              </div>
              <span className="rounded-full bg-[#fff8e8] px-3 py-1.5 text-xs font-bold text-[#a17700]">Credit mengikuti aturan pembuat tugas</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-4">
                <p className="font-bold text-[#1f1f1f]">Membaca Mi Le Cen Cing 3x</p>
                <p className="mt-1 text-sm text-[#6b6254]">Tugas harian pembinaan dasar.</p>
              </div>
              <div className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-4">
                <p className="font-bold text-[#1f1f1f]">Membaca 1 Wejangan &amp; Merenungkan Maknanya</p>
                <p className="mt-1 text-sm text-[#6b6254]">Credit refleksi mengikuti nilai yang ditentukan admin.</p>
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

          {upcomingSchedule.length ? (
            <section className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-lg shadow-amber-950/5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-[#1f1f1f]">Upcoming Schedule</h2>
                <Link href="/user/events" className="text-sm font-bold text-[#a17700] hover:text-[#1f1f1f]">Lihat semua</Link>
              </div>
              <div className="mt-4 divide-y divide-[#e8ddc4] overflow-hidden rounded-xl border border-[#e8ddc4] bg-white">
                {upcomingSchedule.map((event) => (
                  <Link key={event.id} href="/user/events" className="flex flex-col gap-4 p-4 transition hover:bg-[#fff8e8] md:flex-row md:items-center">
                    <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#f8f1de] via-[#fff8e8] to-[#f7d6e7] text-[#a17700] md:w-36">
                      <Sparkles size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-[#1f1f1f]">{event.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6b6254]">
                        <span className="inline-flex items-center gap-1"><MapPin size={14} />{event.hostingBranch.name}</span>
                        <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{formatJakartaDate(event.startAt)}, {formatJakartaTime(event.startAt)}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-lg bg-[#fff8e8] px-3 py-1 text-[#6b6254]">Peserta: {event._count.participants}</span>
                      </div>
                    </div>
                    <span className="btn-primary inline-flex shrink-0 justify-center px-5 py-2.5 text-sm font-bold md:ml-auto">Daftar acara</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="surface rounded-2xl p-5">
            <h2 className="text-xl font-black text-[#1f1f1f]">Acara saya</h2>
            <div className="mt-3 space-y-2">
              {[...todayEvents, ...myParticipants.map((item) => item.event)]
                .filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index)
                .slice(0, 5)
                .map((event) => (
                  <Link key={event.id} href="/user/events" className="block rounded-xl border border-[#e8ddc4] bg-white p-3 transition hover:bg-[#fff8e8]">
                    <p className="text-sm font-bold text-[#1f1f1f]">{event.title}</p>
                    <p className="mt-1 text-xs text-[#6b6254]">{event.hostingBranch.name} • {new Date(event.startAt).toLocaleString("id-ID")}</p>
                  </Link>
                ))}
              {myParticipants.length === 0 && todayEvents.length === 0 ? <p className="text-sm text-neutral-500">Belum ada acara.</p> : null}
            </div>
          </section>

          {availableEvents.length ? (
            <section className="surface rounded-2xl p-5">
              <h2 className="text-xl font-black text-[#1f1f1f]">Event tersedia</h2>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {availableEvents.map((event) => (
                  <Link key={event.id} href="/user/events" className="rounded-xl border border-[#e8ddc4] bg-white p-3 transition hover:bg-[#fff8e8]">
                    <p className="text-sm font-bold text-[#1f1f1f]">{event.title}</p>
                    <p className="mt-1 text-xs text-[#6b6254]">{event.hostingBranch.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#9a6a00]">{isLeader || isTrainer ? "Multi-Branch Dharma Learning" : "Fa Hui Cu Learning Journey"}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-[#1f1f1f] md:text-4xl">
          {isLeader || isTrainer ? "Rangkuman operasional lintas cabang" : "Home"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          {isLeader || isTrainer
            ? <>Scope dashboard: <strong>{dashboardScopeLabel(user, roles)}</strong>. Super Admin melihat semua cabang, Ketua melihat cabang sendiri, Trainer melihat event yang ditangani.</>
            : "Ringkasan tugas harian, jadwal dekat, feedback, materi, dan credit pembelajaran pribadi."}
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
        ) : isTrainer ? (
          <>
            <StatCard label="Event saya" value={`${events.length}`} detail="Assigned sebagai trainer/speaker" icon={CalendarDays} />
            <StatCard label="Feedback masuk" value={`${feedbacks.length}`} detail="Dalam scope event saya" icon={BarChart3} />
            <StatCard label="Credit pembelajaran" value={`${user.creditBalance}`} detail="Credit pribadi" icon={Star} />
            <StatCard label="Feedback saya" value={`${feedbackTodo}`} detail="Perlu submit/edit" icon={ClipboardCheck} />
          </>
        ) : (
          <>
            <StatCard label="Credit saya" value={`${user.creditBalance}`} detail="Progress pembelajaran pribadi" icon={Star} />
            <StatCard label="Kelas saya" value={user.currentClass?.name || "-"} detail={user.homeBranch.foThangName} icon={BookOpenText} />
            <StatCard label="Feedback topik" value={`${pendingTopicFeedbackCount}`} detail="Sesi/topik yang perlu feedback" icon={ClipboardCheck} />
            <StatCard label="Refleksi event" value={`${pendingEventReflectionCount}`} detail="Refleksi keseluruhan yang pending" icon={ClipboardCheck} />
          </>
        )}
      </section>

      {!isLeader && !isTrainer ? (
        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="surface rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6a00]">Daily task</p>
            <h2 className="mt-2 text-lg font-semibold text-neutral-950">Wejangan Harian</h2>
            {latestWejangan ? (
              <>
                <p className="mt-2 text-sm font-semibold text-neutral-900">{latestWejangan.title}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">{latestWejangan.content}</p>
                <p className="mt-3 text-xs text-neutral-500">{latestWejangan.reflections.length ? "Refleksi hari ini sudah dikirim." : `Tulis refleksi untuk +${latestWejangan.creditReward} credit.`}</p>
                <a href="/user/wejangan" className="mt-4 inline-flex rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black">Buka wejangan</a>
              </>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Belum ada wejangan harian.</p>
            )}
          </div>

          <div className="surface rounded-lg p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Acara hari ini / check-in</h2>
            <div className="mt-4 space-y-3">
              {todayEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <p className="font-semibold text-neutral-900">{event.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{event.hostingBranch.name} • {new Date(event.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                  <a href="/user/events" className="mt-3 inline-flex text-sm font-bold text-[#9a6a00]">Lihat detail/check-in</a>
                </div>
              ))}
              {todayEvents.length === 0 ? <p className="text-sm text-neutral-500">Tidak ada acara approved untuk hari ini.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {isLeader ? <div className="mt-6"><ApprovalQueue /></div> : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1f1f1f]">{isTrainer ? "Event yang saya pegang" : isLeader ? "Ringkasan acara" : "Event saya"}</h2>
              <p className="text-sm text-neutral-500">Event sudah terhubung dengan cabang/Fo Thang dan status registrasi.</p>
            </div>
            <CalendarDays className="text-[#9a6a00]" size={22} />
          </div>
          <div className="mt-5 space-y-3">
            {(isLeader || isTrainer ? events : myParticipants.map((item) => item.event)).map((event) => {
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
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-[#fff7e8] p-3">Absensi: <strong>{attendanceRate}%</strong></div>
                    <div className="rounded-md bg-[#f5f5f5] p-3">Purpose: <strong>{purposeScore ? `${purposeScore}/5` : "-"}</strong></div>
                    <div className={`rounded-md p-3 ${belowTarget ? "bg-amber-50 text-amber-800" : "bg-[#fff7e8]"}`}>
                      Peserta: <strong>{event._count.participants}/{event.minimumParticipants || "-"}</strong>
                    </div>
                    <div className="rounded-md bg-[#f5f5f5] p-3">Feedback: <strong>{event._count.feedbacks}</strong></div>
                  </div>
                </div>
              );
            })}
            {(isLeader || isTrainer ? events.length : myParticipants.length) === 0 ? <p className="text-sm text-neutral-500">Belum ada event dalam scope ini.</p> : null}
          </div>
        </div>

        <div className="grid gap-6">
          {isLeader ? <div className="surface rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1f1f1f]">Cabang / Fo Thang</h2>
              <Users className="text-[#9a6a00]" size={22} />
            </div>
            <div className="mt-4 space-y-3">
              {branches.map((branch) => (
                <div key={branch.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <p className="text-sm font-semibold text-neutral-800">{branch.name}</p>
                  <p className="text-xs text-neutral-500">{branch.foThangName}</p>
                  <p className="mt-2 text-xs text-neutral-500">{branch._count.users} anggota • {branch._count.events} event</p>
                </div>
              ))}
            </div>
          </div> : null}

          {isLeader || isTrainer ? (
          <div className="surface rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1f1f1f]">Evaluasi feedback</h2>
              <BarChart3 className="text-[#9a6a00]" size={22} />
            </div>
            <div className="mt-4 space-y-3">
              {feedbacks.slice(0, 5).map((feedback) => (
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
          ) : null}

          {!isLeader && !isTrainer ? (
            <>
              <div className="surface rounded-lg p-5">
                <h2 className="text-lg font-semibold text-[#1f1f1f]">Event tersedia</h2>
                <div className="mt-4 space-y-3">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                      <p className="text-sm font-semibold text-neutral-800">{event.title}</p>
                      <p className="text-xs text-neutral-500">{event.hostingBranch.name} • {event.targetClass?.name || "Semua kelas"}</p>
                      <p className="mt-2 text-xs text-neutral-500">{event._count.participants} peserta terdaftar</p>
                    </div>
                  ))}
                  {availableEvents.length === 0 ? <p className="text-sm text-neutral-500">Belum ada event baru yang tersedia.</p> : null}
                </div>
              </div>

              <div className="surface rounded-lg p-5">
                <h2 className="text-lg font-semibold text-[#1f1f1f]">Feedback saya</h2>
                <div className="mt-4 space-y-3">
                  {feedbackActionItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                      <p className="text-sm font-semibold text-neutral-800">{item.event.title}</p>
                      <p className="text-xs text-neutral-500">{item.event.hostingBranch.name} • {item.event.feedbacks.length ? "Bisa diedit" : "Perlu diisi"}</p>
                    </div>
                  ))}
                  {feedbackActionItems.length === 0 ? <p className="text-sm text-neutral-500">Belum ada feedback yang perlu diisi atau diedit.</p> : null}
                </div>
              </div>

              <div className="surface rounded-lg p-5">
                <h2 className="text-lg font-semibold text-[#1f1f1f]">Materi event saya</h2>
                <div className="mt-4 space-y-3">
                  {myMaterials.map((material) => (
                    <a key={material.id} href={material.fileUrl} className="block rounded-lg border border-neutral-200 bg-white p-3 hover:bg-[#fff7e8]" target="_blank">
                      <p className="text-sm font-semibold text-neutral-800">{material.title}</p>
                      <p className="text-xs text-neutral-500">{material.event?.title || "Materi umum"} • {material.type}</p>
                    </a>
                  ))}
                  {myMaterials.length === 0 ? <p className="text-sm text-neutral-500">Belum ada materi untuk event yang diikuti.</p> : null}
                </div>
              </div>
            </>
          ) : null}

          {isLeader || isTrainer ? <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface rounded-lg p-5">
              <QrCode className="text-[#9a6a00]" size={24} />
              <h3 className="mt-3 font-semibold">QR attendance</h3>
              <p className="mt-1 text-sm text-neutral-500">Walk-in dan check-in peserta per cabang.</p>
            </div>
            <div className="surface rounded-lg p-5">
              <FileText className="text-[#9a6a00]" size={24} />
              <h3 className="mt-3 font-semibold">Materi</h3>
              <p className="mt-1 text-sm text-neutral-500">Materi nantinya bisa mengikuti event/cabang/kelas.</p>
            </div>
          </div> : null}
        </div>
      </section>
    </AppChrome>
  );
}
