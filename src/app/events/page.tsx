import AppChrome from "@/components/AppChrome";
import EventsEngine from "./EventsEngine";

export default function EventsPage() {
  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Event Engine</p>
        <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">Acara, training, dan Dharma Assembly</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Event sekarang operational: menyimpan tujuan, expected outcome, lifecycle, QR token, target kelas,
          dan participant role per event.
        </p>
      </section>
      <EventsEngine />
    </AppChrome>
  );
}
