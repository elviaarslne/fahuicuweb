import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import UserEventActions from "./UserEventActions";

function sameDay(a: Date, b: Date) {
  return formatJakartaDateKey(a) === formatJakartaDateKey(b);
}

function formatJakartaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
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


function isTrainingCategory(category?: string | null) {
  const normalized = (category || "").toLowerCase();
  return normalized.includes("training") || normalized.includes("pelatihan");
}

function registrationLabel(status?: string) {
  if (status === "APPROVED") return "Registered";
  if (status === "PENDING_APPROVAL") return "Pending";
  if (status === "REJECTED") return "Tidak eligible";
  if (status === "CANCELLED") return "Cancelled";
  return "";
}

function formatEventWindow(startAt: Date, endAt?: Date | null) {
  if (!endAt || sameDay(startAt, endAt)) {
    return `${formatJakartaDate(startAt)}, ${formatJakartaTime(startAt)}${endAt ? ` - ${formatJakartaTime(endAt)}` : ""}`;
  }
  return `${formatJakartaDate(startAt)}, ${formatJakartaTime(startAt)} - ${formatJakartaDate(endAt)}, ${formatJakartaTime(endAt)}`;
}

const tabs = [
  { key: "future", label: "Upcoming", empty: "Belum ada Sidang Dharma yang akan datang." },
  { key: "today", label: "Today", empty: "Belum ada Sidang Dharma hari ini." },
  { key: "past", label: "Past", empty: "Belum ada riwayat Sidang Dharma." },
] as const;

type UserEventsTab = (typeof tabs)[number]["key"];

function normalizeTab(value?: string): UserEventsTab {
  if (value === "past" || value === "today" || value === "future") return value;
  return "future";
}

export default async function UserEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;
  }

  const now = new Date();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = normalizeTab(resolvedSearchParams.tab);
  const events = await prisma.event.findMany({
    where: { status: { in: ["PUBLISHED", "REGISTRATION_OPEN", "ONGOING", "COMPLETED", "FEEDBACK_COLLECTION", "ARCHIVED"] } },
    include: {
      hostingBranch: true,
      targetClass: true,
      sessions: { orderBy: [{ orderNumber: "asc" }, { startAt: "asc" }] },
      participants: { where: { userId: user.id } },
      attendances: { where: { userId: user.id } },
      _count: { select: { participants: true } },
    },
    orderBy: { startAt: "asc" },
  });

  const sidangDharmaEvents = events.filter((event) => !isTrainingCategory(event.category));

  const visibleEvents = {
    past: sidangDharmaEvents.filter((event) => {
      const participant = event.participants[0];
      return ["COMPLETED", "FEEDBACK_COLLECTION", "ARCHIVED"].includes(event.status) && Boolean(participant);
    }),
    today: sidangDharmaEvents.filter((event) => {
      const participant = event.participants[0];
      const isApprovedOrOpen = !participant || participant.registrationStatus === "APPROVED";
      return sameDay(event.startAt, now) && ["PUBLISHED", "REGISTRATION_OPEN", "ONGOING"].includes(event.status) && isApprovedOrOpen;
    }),
    future: sidangDharmaEvents.filter((event) => event.startAt > now && !sameDay(event.startAt, now) && ["PUBLISHED", "REGISTRATION_OPEN"].includes(event.status)),
  } satisfies Record<UserEventsTab, typeof events>;
  const activeItems = visibleEvents[activeTab];
  const activeMeta = tabs.find((tab) => tab.key === activeTab) ?? tabs[2];

  return (
    <AppChrome>
      <section className="mb-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`/user/events?tab=${tab.key}`}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.key
                  ? "border-[#e8b923] bg-[#f4c62b] text-[#1f1f1f] shadow-sm shadow-amber-900/10"
                  : "border-[#e8ddc4] bg-white text-[#6b6254] hover:bg-[#f8f1de] hover:text-[#1f1f1f]"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </section>

      <section className="surface rounded-3xl p-4 md:p-5">
        <div className="grid gap-3">
          {activeItems.map((event) => {
            const participant = event.participants[0];
            const isRegistered = Boolean(participant);
            const isApproved = participant?.registrationStatus === "APPROVED";
            const isFuture = activeTab === "future";
            const canCheckIn = activeTab === "today" && isRegistered && isApproved && ["REGISTRATION_OPEN", "ONGOING"].includes(event.status) && sameDay(event.startAt, now);
            const statusLabel = registrationLabel(participant?.registrationStatus);
            return (
              <article key={event.id} className="rounded-2xl border border-[#e8ddc4] bg-white p-4 shadow-sm shadow-amber-900/5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9aa7bd]">Sidang Dharma</p>
                    <h3 className="mt-1 text-lg font-black text-[#1f1f1f]">{event.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6b6254]">
                      {formatEventWindow(event.startAt, event.endAt)} • {event.location || event.hostingBranch.name || "Lokasi menyusul"}
                    </p>
                  </div>
                  {!isRegistered && isFuture ? (
                    <UserEventActions eventId={event.id} qrToken={event.qrToken} canCheckIn={false} isRegistered={false} registerLabel="Register Now" />
                  ) : null}
                  {statusLabel ? (
                    <span className={`inline-flex shrink-0 justify-center rounded-full px-4 py-2 text-sm font-black ${
                      participant?.registrationStatus === "APPROVED"
                        ? "bg-[#2e7d61]/12 text-[#2e7d61]"
                        : participant?.registrationStatus === "PENDING_APPROVAL"
                          ? "bg-[#f4c62b]/22 text-[#8a6b00]"
                          : "bg-[#c62828]/10 text-[#c62828]"
                    }`}>{statusLabel}</span>
                  ) : null}
                  {canCheckIn ? <UserEventActions eventId={event.id} qrToken={event.qrToken} canCheckIn={canCheckIn} isRegistered={isRegistered} /> : null}
                </div>
              </article>
            );
          })}
          {activeItems.length === 0 ? <p className="rounded-2xl border border-[#e8ddc4] bg-white p-5 text-sm text-[#6b6254]">{activeMeta.empty}</p> : null}
        </div>
      </section>
    </AppChrome>
  );
}
