import AppChrome from "@/components/AppChrome";
import StatusBadge from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;

  const trainings = await prisma.event.findMany({
    where: {
      OR: [
        { category: { contains: "training" } },
        { category: { contains: "pelatihan" } },
        { participants: { some: { userId: user.id, role: { in: ["TRAINER", "SPEAKER"] } } } },
      ],
    },
    include: {
      hostingBranch: true,
      sessions: { orderBy: [{ orderNumber: "asc" }, { startAt: "asc" }] },
      participants: { where: { userId: user.id } },
    },
    orderBy: { startAt: "asc" },
    take: 20,
  });

  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Training</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">Training Saya</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">Ruang ringkas untuk pelatihan yang tersedia atau yang kamu pegang sebagai trainer/speaker.</p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {trainings.map((event) => (
          <article key={event.id} className="surface rounded-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-neutral-950">{event.title}</h2>
                <p className="mt-1 text-xs text-neutral-500">{event.hostingBranch.name} • {new Date(event.startAt).toLocaleString("id-ID")}</p>
              </div>
              <StatusBadge value={event.status} />
            </div>
            <div className="mt-4 space-y-2">
              {event.sessions.map((session) => (
                <div key={session.id} className="rounded-lg bg-[#fff7e8] p-3 text-sm">
                  <p className="font-semibold text-neutral-900">{session.title}</p>
                  <p className="text-xs text-neutral-500">{session.description || "Belum ada deskripsi."}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
        {trainings.length === 0 ? <p className="text-sm text-neutral-500">Belum ada training yang relevan.</p> : null}
      </div>
    </AppChrome>
  );
}
