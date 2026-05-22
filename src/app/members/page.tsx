import AppChrome from "@/components/AppChrome";
import { canAccess } from "@/lib/access-control";
import { getCurrentUser } from "@/lib/session";
import MembersTable from "./MembersTable";

export default async function MembersPage() {
  const user = await getCurrentUser();
  const roles = user?.systemRoles.map((role) => role.role) || [];
  const memberAccess = canAccess(roles, "viewAllMembers");

  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#1f1f1f]">Daftar anggota dan evaluasi pendaftar</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
              Ketua, sub-ketua divisi, dan admin mengevaluasi pendaftar di sini. Kategori anggota
              adalah Ban Shi Jen Yuan, Jiang Yuan, Tan Zhu, atau Jiang Shi. Role seperti koordinator,
              pengawas, MC, trainer, dan speaker akan ditetapkan per event/sesi training.
            </p>
          </div>
        </div>
        {memberAccess === "allow" || memberAccess === "partial" ? (
          <MembersTable />
        ) : (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-[#fff7e8] p-5 text-sm leading-6 text-neutral-600">
            Halaman database anggota hanya tersedia untuk Ketua, Sub-ketua, Admin, atau Super Admin.
            Menu ini juga disembunyikan otomatis dari sidebar untuk role yang tidak memiliki akses.
          </div>
        )}
      </section>
    </AppChrome>
  );
}
