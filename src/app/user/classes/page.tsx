import AppChrome from "@/components/AppChrome";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import ClassModuleList from "./ClassModuleList";

function branchDisplay(branch?: { name: string; foThangName: string } | null) {
  if (!branch) return "Belum ditentukan";
  return branch.foThangName || branch.name;
}

export default async function MyClassPage() {
  const user = await getCurrentUser();
  if (!user) return <AppChrome><div className="surface rounded-lg p-6">Silakan login dahulu.</div></AppChrome>;

  const classmates = user.currentClassId
    ? await prisma.user.count({ where: { currentClassId: user.currentClassId, status: "ACTIVE" } })
    : 0;
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
  const moduleItems = modules.map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    materialUrl: module.materialUrl,
    classLevelName: module.classLevel?.name ?? null,
    progress: module.progress[0] ? {
      isCompleted: module.progress[0].isCompleted,
      completedAt: module.progress[0].completedAt?.toISOString() ?? null,
      notes: module.progress[0].notes,
      photoUrl: module.progress[0].photoUrl,
    } : null,
  }));

  return (
    <AppChrome>
      <section className="rounded-3xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a17700]">Kelas Saya</p>
        <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">{user.currentClass?.name || "Kelas belum ditentukan"}</h1>
      </section>
      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="surface rounded-3xl p-4">
          <p className="text-sm font-bold text-[#6b6254]">Cao Che / MC kelas</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-[#fff8e8] text-sm font-black text-[#a17700] ring-2 ring-[#f8f1de]">
              CC
            </div>
            <div>
              <p className="font-black text-[#1f1f1f]">Belum ditentukan</p>
              <p className="text-xs text-[#6b6254]">Kontak akan diumumkan</p>
            </div>
          </div>
        </div>
        <div className="surface rounded-3xl p-4">
          <p className="text-sm font-bold text-[#6b6254]">Fo Thang</p>
          <p className="mt-2 text-xl font-bold text-[#1f1f1f]">{branchDisplay(user.homeBranch)}</p>
        </div>
        <div className="surface rounded-3xl p-4">
          <p className="text-sm font-bold text-[#6b6254]">Teman kelas</p>
          <p className="mt-2 text-3xl font-black text-[#1f1f1f]">{classmates}</p>
        </div>
      </section>
      <section className="mt-4 surface rounded-3xl p-4">
        <h2 className="text-lg font-black text-[#1f1f1f]">Modul Pembelajaran</h2>
        <div className="mt-3">
          <ClassModuleList modules={moduleItems} />
        </div>
      </section>
    </AppChrome>
  );
}
