import { BookOpenText, CalendarDays, ClipboardCheck, FileText, Star } from "lucide-react";
import AppChrome from "@/components/AppChrome";
import { events } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/session";

export default async function UserEndPage() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <AppChrome>
      <section className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#9a6a00]">User end</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">
          Selamat datang{user?.fullName ? `, ${user.fullName}` : ""}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Area ini untuk anggota biasa, trainer, speaker, dan peserta yang menggunakan sistem tanpa akses database admin.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="surface rounded-lg p-5">
          <Star className="text-[#9a6a00]" size={24} />
          <p className="mt-3 text-sm text-neutral-500">Credit saya</p>
          <p className="mt-1 text-3xl font-black">{user?.creditBalance ?? 0}</p>
        </div>
        <div className="surface rounded-lg p-5">
          <BookOpenText className="text-[#9a6a00]" size={24} />
          <p className="mt-3 text-sm text-neutral-500">Kelas saya</p>
          <p className="mt-1 text-lg font-bold">{user?.currentClass?.name || "Belum ditentukan"}</p>
        </div>
        <div className="surface rounded-lg p-5">
          <ClipboardCheck className="text-[#9a6a00]" size={24} />
          <p className="mt-3 text-sm text-neutral-500">Feedback tertunda</p>
          <p className="mt-1 text-3xl font-black">2</p>
        </div>
        <div className="surface rounded-lg p-5">
          <FileText className="text-[#9a6a00]" size={24} />
          <p className="mt-3 text-sm text-neutral-500">Materi tersedia</p>
          <p className="mt-1 text-3xl font-black">8</p>
        </div>
      </section>

      <section className="mt-6 surface rounded-lg p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Acara yang bisa diikuti</h2>
          <CalendarDays className="text-[#9a6a00]" size={22} />
        </div>
        <div className="mt-4 grid gap-3">
          {events.map((event) => (
            <div key={event.title} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="font-semibold text-neutral-900">{event.title}</p>
              <p className="mt-1 text-sm text-neutral-500">{event.date} • {event.target}</p>
              <button className="mt-3 rounded-md bg-[#f4b63f] px-3 py-2 text-sm font-semibold text-[#1f1f1f]">
                Daftar / lihat detail
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppChrome>
  );
}
