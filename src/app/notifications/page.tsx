import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, MessageSquareText, PenLine, Sparkles } from "lucide-react";
import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AppChrome>
        <section className="surface rounded-2xl p-6">
          <h1 className="text-2xl font-black text-[#1f1f1f]">Notifikasi</h1>
          <p className="mt-2 text-sm text-[#6b6254]">Silakan login untuk melihat notifikasi.</p>
        </section>
      </AppChrome>
    );
  }

  const [topicFeedbacks, eventReflections, todayEvents] = await Promise.all([
    prisma.eventSession.findMany({
      where: {
        event: {
          participants: { some: { userId: user.id, registrationStatus: "APPROVED" } },
          status: { in: ["COMPLETED", "FEEDBACK_COLLECTION"] },
        },
        topicFeedbacks: { none: { userId: user.id } },
      },
      include: {
        event: { include: { hostingBranch: true } },
        speaker: true,
      },
      orderBy: [{ event: { startAt: "desc" } }, { orderNumber: "asc" }],
      take: 10,
    }),
    prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        registrationStatus: "APPROVED",
        event: {
          status: { in: ["COMPLETED", "FEEDBACK_COLLECTION"] },
          eventReflections: { none: { userId: user.id } },
        },
      },
      include: { event: { include: { hostingBranch: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        registrationStatus: "APPROVED",
        event: {
          startAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
      include: { event: { include: { hostingBranch: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const hasNotifications = topicFeedbacks.length > 0 || eventReflections.length > 0 || todayEvents.length > 0;

  return (
    <AppChrome>
      <section className="space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6a00]">Activity</p>
          <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">Notifikasi</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-950/5">
            <Bell className="text-[#a17700]" size={22} />
            <p className="mt-4 text-3xl font-black text-[#1f1f1f]">{topicFeedbacks.length + eventReflections.length}</p>
            <p className="text-sm font-semibold text-[#6b6254]">Reminder</p>
          </div>
          <div className="rounded-2xl border border-[#d5eadf] bg-[#f8fffb] p-5 shadow-sm shadow-amber-950/5">
            <MessageSquareText className="text-[#2e7d61]" size={22} />
            <p className="mt-4 text-3xl font-black text-[#1f1f1f]">{topicFeedbacks.length}</p>
            <p className="text-sm font-semibold text-[#6b6254]">Feedback topic</p>
          </div>
          <div className="rounded-2xl border border-[#f7d6e7] bg-[#fff8fc] p-5 shadow-sm shadow-amber-950/5">
            <PenLine className="text-[#b85283]" size={22} />
            <p className="mt-4 text-3xl font-black text-[#1f1f1f]">{eventReflections.length}</p>
            <p className="text-sm font-semibold text-[#6b6254]">Refleksi event</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8ddc4] bg-white shadow-sm shadow-amber-950/5">
          {topicFeedbacks.map((session) => (
            <Link key={`topic-${session.id}`} href="/feedback" className="flex items-center gap-4 border-b border-[#e8ddc4] p-4 transition last:border-b-0 hover:bg-[#fff8e8]">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#2e7d61]/14 text-[#2e7d61]">
                <MessageSquareText size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-[#1f1f1f]">Feedback topic belum diisi</span>
                <span className="mt-1 block truncate text-sm text-[#6b6254]">
                  {session.title} • {session.event.title}
                  {session.speaker ? ` • ${session.speaker.chineseName || session.speaker.fullName}` : ""}
                </span>
              </span>
              <ChevronRight className="text-[#6b6254]" size={18} />
            </Link>
          ))}

          {eventReflections.map((participant) => (
            <Link key={`reflection-${participant.id}`} href="/feedback" className="flex items-center gap-4 border-b border-[#e8ddc4] p-4 transition last:border-b-0 hover:bg-[#fff8e8]">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#efa3c8]/24 text-[#b85283]">
                <PenLine size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-[#1f1f1f]">Refleksi event belum diisi</span>
                <span className="mt-1 block truncate text-sm text-[#6b6254]">
                  {participant.event.title} • {participant.event.hostingBranch.name}
                </span>
              </span>
              <ChevronRight className="text-[#6b6254]" size={18} />
            </Link>
          ))}

          {todayEvents.map((participant) => (
            <Link key={`event-${participant.id}`} href="/user/events" className="flex items-center gap-4 border-b border-[#e8ddc4] p-4 transition last:border-b-0 hover:bg-[#fff8e8]">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f4c62b]/18 text-[#a17700]">
                <CalendarDays size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-[#1f1f1f]">Event hari ini</span>
                <span className="mt-1 block truncate text-sm text-[#6b6254]">
                  {participant.event.title} • {formatDate(participant.event.startAt)}
                </span>
              </span>
              <ChevronRight className="text-[#6b6254]" size={18} />
            </Link>
          ))}

          {!hasNotifications ? (
            <div className="grid place-items-center p-10 text-center">
              <Sparkles className="text-[#a17700]" size={28} />
              <p className="mt-3 text-sm font-semibold text-[#1f1f1f]">Tidak ada notifikasi baru.</p>
              <p className="mt-1 text-sm text-[#6b6254]">Kalau ada feedback atau refleksi yang perlu diisi, nanti muncul di sini.</p>
            </div>
          ) : null}
        </div>
      </section>
    </AppChrome>
  );
}
