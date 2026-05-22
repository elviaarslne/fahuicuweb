import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import ModuleProgressForm from "./ModuleProgressForm";

export default async function LearningModulesPage() {
  const user = await getCurrentUser();
  if (!user) return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;

  const modules = await prisma.learningModule.findMany({
    where: {
      isActive: true,
      OR: [{ classLevelId: null }, { classLevelId: user.currentClassId }],
    },
    include: {
      classLevel: true,
      progress: { where: { userId: user.id } },
    },
    orderBy: [{ orderNumber: "asc" }, { createdAt: "asc" }],
  });

  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Pembelajaran</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">Modul Pembelajaran</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">Catatan dan foto modul dapat dilihat admin sebagai arsip pembelajaran, tetapi tetap berada di lingkungan internal.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {modules.map((module) => {
          const progress = module.progress[0];
          return (
            <article key={module.id} className="surface rounded-lg p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6a00]">{module.classLevel?.name || "Modul umum"}</p>
              <h2 className="mt-2 text-lg font-semibold text-neutral-950">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{module.description || "Deskripsi modul belum tersedia."}</p>
              {module.materialUrl ? <a href={module.materialUrl} target="_blank" className="mt-3 inline-flex text-sm font-bold text-[#9a6a00]">Buka materi</a> : null}
              <ModuleProgressForm moduleId={module.id} initialCompleted={progress?.isCompleted} initialNotes={progress?.notes} initialPhotoUrl={progress?.photoUrl} />
            </article>
          );
        })}
        {modules.length === 0 ? <p className="text-sm text-neutral-500">Belum ada modul untuk kelas saat ini.</p> : null}
      </div>
    </AppChrome>
  );
}
