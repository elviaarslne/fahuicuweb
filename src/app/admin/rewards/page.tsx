import AppChrome from "@/components/AppChrome";
import StatusBadge from "@/components/StatusBadge";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminCreateForm } from "../AdminCrudForms";

export default async function AdminRewardsPage() {
  const user = await getCurrentUser();
  if (!isContentManager(user)) {
    return <AppChrome><section className="surface rounded-lg p-6">Akses admin konten diperlukan.</section></AppChrome>;
  }
  const items = await prisma.reward.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Admin Content</p>
        <h1 className="mt-2 text-3xl font-black text-neutral-950">Reward Store</h1>
      </section>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminCreateForm
          endpoint="/api/admin/rewards"
          buttonLabel="Tambah reward"
          fields={[
            { name: "name", label: "Nama reward" },
            { name: "description", label: "Deskripsi", textarea: true },
            { name: "imageUrl", label: "Image URL" },
            { name: "creditPrice", label: "Harga credit", type: "number" },
            { name: "stock", label: "Stock opsional", type: "number" },
          ]}
        />
        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Daftar reward</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">{item.creditPrice} credit • Stock {item.stock ?? "unlimited"}</p>
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
