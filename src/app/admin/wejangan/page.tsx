import AppChrome from "@/components/AppChrome";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminCreateForm } from "../AdminCrudForms";

export default async function AdminWejanganPage() {
  const user = await getCurrentUser();
  if (!isContentManager(user)) {
    return <AppChrome><section className="surface rounded-lg p-6">Akses admin konten diperlukan.</section></AppChrome>;
  }
  const items = await prisma.dailyWejangan.findMany({ orderBy: { uploadDate: "desc" }, take: 50 });
  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Admin Content</p>
        <h1 className="mt-2 text-3xl font-black text-neutral-950">Wejangan Harian</h1>
      </section>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminCreateForm
          endpoint="/api/admin/wejangan"
          buttonLabel="Tambah wejangan"
          fields={[
            { name: "title", label: "Judul" },
            { name: "source", label: "Sumber" },
            { name: "uploadDate", label: "Tanggal upload", type: "date" },
            { name: "content", label: "Konten", textarea: true },
            { name: "reflectionQuestion", label: "Pertanyaan refleksi", textarea: true },
            { name: "creditReward", label: "Credit reward", type: "number", placeholder: "10" },
          ]}
        />
        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Daftar wejangan</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="font-semibold text-neutral-900">{item.title}</p>
                <p className="text-xs text-neutral-500">{new Date(item.uploadDate).toLocaleDateString("id-ID")} • {item.creditReward} credit</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppChrome>
  );
}
