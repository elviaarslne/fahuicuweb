import AppChrome from "@/components/AppChrome";
import EventsEngine from "./EventsEngine";

export default function EventsPage() {
  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Sidang Dharma Admin</p>
        <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">Perencanaan Sidang Dharma</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Kelola draft, assignment operasional, publikasi, registrasi, absensi, dan feedback tanpa menampilkan draft ke user end.
        </p>
      </section>
      <EventsEngine />
    </AppChrome>
  );
}
