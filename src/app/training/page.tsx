import AppChrome from "@/components/AppChrome";

const trainingSections = [
  {
    title: "Daftar Program Training",
    status: "Struktur V2",
    description: "Program training akan menjadi induk dari beberapa batch, bukan bagian dari lifecycle Sidang Dharma.",
  },
  {
    title: "Buat Program Training",
    status: "Belum aktif",
    description: "Field yang disiapkan: judul, deskripsi, tujuan, dan expected outcome.",
  },
  {
    title: "Daftar Batch",
    status: "Belum aktif",
    description: "Batch menyimpan periode training, kapasitas, scope cabang, dan status enrollment.",
  },
  {
    title: "Buat Batch",
    status: "Belum aktif",
    description: "Batch akan berisi start/end date, jadwal pendaftaran, eligibility, dan completion rules.",
  },
  {
    title: "Sesi Training",
    status: "Belum aktif",
    description: "Sesi training berulang dan trainer ditetapkan per sesi, bukan sebagai speaker Sidang Dharma.",
  },
  {
    title: "Peserta Training",
    status: "Belum aktif",
    description: "User akan enroll ke batch. Tidak memakai approval peserta Sidang Dharma secara default.",
  },
  {
    title: "Eligibility",
    status: "Belum aktif",
    description: "Eligibility training dapat memakai umur, class level, hierarchy role, division, atau manual user.",
  },
  {
    title: "Completion Rules",
    status: "Belum aktif",
    description: "Completion akan dihitung dari attendance percentage, assignment, dan exam saat modul grading siap.",
  },
];

export default function TrainingAdminPage() {
  return (
    <AppChrome>
      <section className="surface rounded-lg p-5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a6a00]">Training Admin</p>
        <h1 className="mt-2 text-2xl font-black text-[#1f1f1f]">Manajemen Training</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Training adalah pelatihan berbasis batch yang berjalan dalam beberapa sesi. Modul ini dipisahkan dari Sidang Dharma agar program 1-3 bulan, enrollment batch, trainer per sesi, dan completion rules tidak tercampur dengan event 1-3 hari.
        </p>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {trainingSections.map((section) => (
          <article key={section.title} className="rounded-lg border border-[#e8ddc4] bg-[#fffdf7] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-[#1f1f1f]">{section.title}</h2>
              <span className="rounded-full bg-[#f8f1de] px-2.5 py-1 text-[11px] font-bold text-[#6b6254]">{section.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{section.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <p className="font-bold">Catatan implementasi aman</p>
        <p className="mt-1">
          Backend TrainingProgram, TrainingBatch, TrainingSession, TrainingEnrollment, TrainingAttendance, TrainingEligibilityRule, dan TrainingCompletionRule belum dibuat pada task ini supaya database V1 tidak berubah besar tanpa review.
        </p>
      </section>
    </AppChrome>
  );
}
