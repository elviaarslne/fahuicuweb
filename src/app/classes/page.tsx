import AppChrome from "@/components/AppChrome";
import { classLevels } from "@/lib/mock-data";

export default function ClassesPage() {
  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Kelas reguler</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tujuh kelas tetap. Qiu Dao baru mulai dari Kelas 1, admin dapat menetapkan anggota lama langsung ke kelas saat ini.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classLevels.map((item) => (
            <article key={`${item.level}-${item.name}`} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#f4b63f]">Kelas {item.level}</p>
              <h2 className="mt-2 text-lg font-semibold text-[#1f1f1f]">{item.name}</h2>
              <p className="mt-3 text-sm text-neutral-500">{item.members} anggota aktif terdata</p>
            </article>
          ))}
        </div>
      </section>
    </AppChrome>
  );
}
