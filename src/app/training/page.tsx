import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAllowed } from "@/lib/access-control";
import TrainingAdminClient from "@/app/training/TrainingAdminClient";

type SerializedDates<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: null extends T[P] ? string | null : string;
};

function serializeDate<T extends Record<string, unknown>, K extends keyof T>(
  row: T,
  keys: K[],
): SerializedDates<T, K> {
  const copy: Record<string, unknown> = { ...row };
  for (const key of keys) {
    const value = copy[key as string];
    if (value instanceof Date) copy[key as string] = value.toISOString();
  }
  return copy as SerializedDates<T, K>;
}

export default async function TrainingAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return (
      <AppChrome>
        <section className="surface rounded-lg p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Login diperlukan</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">Manajemen Training</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Silakan login dengan akun aktif untuk melihat data training.</p>
        </section>
      </AppChrome>
    );
  }

  const roles = user.systemRoles.map((role) => role.role);
  const canCreate = isAllowed(roles, "manageTraining");

  const [programsRaw, batchesRaw, sessionsRaw, branches, trainers] = await Promise.all([
    prisma.trainingProgram.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, fullName: true, chineseName: true } },
        _count: { select: { batches: true } },
      },
    }),
    prisma.trainingBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        program: { select: { id: true, title: true } },
        hostingBranch: { select: { id: true, name: true } },
        _count: { select: { sessions: true, enrollments: true } },
      },
    }),
    prisma.trainingSession.findMany({
      orderBy: [{ startAt: "asc" }, { orderNumber: "asc" }],
      include: {
        batch: { select: { id: true, title: true, program: { select: { id: true, title: true } } } },
        trainer: { select: { id: true, fullName: true, chineseName: true, status: true } },
      },
    }),
    prisma.branch.findMany({ orderBy: [{ isCenter: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, chineseName: true, memberCategory: true },
    }),
  ]);

  const programs = programsRaw.map((program) => serializeDate(program, ["createdAt", "updatedAt"]));
  const batches = batchesRaw.map((batch) => serializeDate(batch, ["startDate", "endDate", "registrationOpenAt", "registrationCloseAt", "createdAt", "updatedAt"]));
  const sessions = sessionsRaw.map((session) => serializeDate(session, ["startAt", "endAt", "createdAt", "updatedAt"]));

  return (
    <AppChrome>
      <section className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6a00]">Training Admin</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">Manajemen Training</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b6254]">
          Training adalah pelatihan berbasis batch yang berjalan dalam beberapa sesi.
        </p>
      </section>

      <div className="mt-6">
        <TrainingAdminClient
          initialPrograms={programs}
          initialBatches={batches}
          initialSessions={sessions}
          branches={branches}
          trainers={trainers}
          canCreate={canCreate}
        />
      </div>
    </AppChrome>
  );
}
