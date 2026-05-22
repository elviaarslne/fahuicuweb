import AppChrome from "@/components/AppChrome";
import StatusBadge from "@/components/StatusBadge";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminCreateForm } from "../AdminCrudForms";

export default async function AdminLearningModulesPage() {
  const user = await getCurrentUser();
  if (!isContentManager(user)) {
    return <AppChrome><section className="surface rounded-lg p-6">Akses admin konten diperlukan.</section></AppChrome>;
  }
  const items = await prisma.learningModule.findMany({ include: { classLevel: true }, orderBy: [{ orderNumber: "asc" }, { createdAt: "desc" }] });
  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Admin Content</p>
        <h1 className="mt-2 text-3xl font-black text-neutral-950">Learning Modules</h1>
      </section>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminCreateForm
          endpoint="/api/admin/learning-modules"
          buttonLabel="Tambah modul"
          fields={[
            { name: "title", label: "Judul" },
            { name: "description", label: "Deskripsi", textarea: true },
            { name: "classLevelId", label: "Class level ID opsional", placeholder: "kelas_1" },
            { name: "orderNumber", label: "Urutan", type: "number" },
            { name: "materialUrl", label: "URL materi" },
          ]}
        />
        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Daftar modul</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">{item.orderNumber}. {item.title}</p>
                    <p className="text-xs text-neutral-500">{item.classLevel?.name || "Modul umum"}</p>
                  </div>
                  <StatusBadge value={item.isActive ? "ACTIVE" : "INACTIVE"} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppChrome>
  );
}
