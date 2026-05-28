import AppChrome from "@/components/AppChrome";
import { getCurrentUser } from "@/lib/session";

const userTrainingSections = [
  {
    title: "Batch yang tersedia",
    description: "Nanti menampilkan batch training yang eligible untuk kamu berdasarkan umur, kelas, role, dan aturan training.",
  },
  {
    title: "Training Saya",
    description: "Nanti menampilkan batch training yang sudah kamu ikuti, lengkap dengan status enrollment dan jadwal sesi.",
  },
  {
    title: "Jadwal Sesi",
    description: "Training berjalan beberapa kali, misalnya mingguan selama beberapa bulan. Jadwal akan ditampilkan per batch.",
  },
  {
    title: "Progress",
    description: "Progress training akan dihitung dari attendance, tugas, dan ujian setelah completion rules aktif.",
  },
];

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppChrome>
        <div className="surface rounded-lg p-6">Silakan login dahulu.</div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <section className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Training</p>
        <h1 className="mt-2 text-3xl font-black text-[#1f1f1f]">Training Saya</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Training adalah program pembelajaran berbasis batch. Modul ini dipisahkan dari Sidang Dharma dan akan menampilkan enrollment, sesi, trainer, attendance, serta progress saat backend Training aktif.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {userTrainingSections.map((section) => (
          <article key={section.title} className="surface rounded-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-neutral-950">{section.title}</h2>
              <span className="rounded-full bg-[#fff7e8] px-3 py-1 text-xs font-bold text-[#9a6a00]">Belum aktif</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{section.description}</p>
          </article>
        ))}
      </div>
    </AppChrome>
  );
}
