import Link from "next/link";
import { ChevronRight, MapPin, Sparkles, UsersRound } from "lucide-react";

const copy = {
  title: "Fa Hui Cu Learning Journey",
  subtitle:
    "Pilot sistem internal untuk Fa Hui Cu, Seksi Sidang Dharma di Guang Ji/Guang Ming, untuk mendampingi kelas, sidang Dharma, absensi, materi, dan evaluasi pembelajaran.",
  background:
    "Fa Hui Cu adalah Seksi Sidang Dharma, salah satu dari 10 divisi/seksi dalam Guang Ji/Guang Ming. Tahap awal sistem ini difokuskan untuk Fa Hui Cu terlebih dahulu agar alur anggota, kelas, kegiatan, pelayanan, dan refleksi bisa tertata sebelum diperluas.",
  vision:
    "Membina perjalanan belajar Dharma yang tertib, hangat, dan berkesinambungan bagi umat Guang Ji/Guang Ming.",
  mission:
    "Mendukung pengurus Fa Hui Cu dalam mengelola data anggota, kelas, acara, materi, absensi, pelayanan, dan feedback secara jelas, rapi, dan mudah dievaluasi.",
  quote:
    "Belajar Dharma dimulai dari hati yang jernih, lalu diwujudkan dalam pelayanan yang tekun.",
};

const journey = ["Qiu Dao", "Kelas Reguler", "Fa Hui", "Pembelajaran", "Pelayanan", "Refleksi Diri"];

const branches = [
  { name: "Pusat", detail: "Koordinasi utama" },
  { name: "Sunter", detail: "Kuang Ming Fo Thang" },
  { name: "Grogol", detail: "Kuang Chien Fo Thang" },
  { name: "Teluk Gong", detail: "Kuang Li Fo Thang" },
  { name: "Serpong", detail: "Kuang Yuan Fo Thang" },
];

const activityFocus = [
  "Fa Hui",
  "Than Wu / Altar",
  "Cao Tai / Pelayanan",
  "Ciao Ke / Lagu Suci",
  "FAS",
  "Pelatihan",
  "Data Analysis",
  "Support",
];

function GuangJiMark() {
  return (
    <div className="mx-auto grid size-24 place-items-center rounded-full border-4 border-[#f4b63f] bg-white shadow-lg shadow-[#f4b63f]/20">
      <div className="grid size-16 place-items-center rounded-full bg-[#ffe7a3] text-center">
        <span className="text-2xl font-black leading-none text-[#1f1f1f]">廣濟</span>
      </div>
    </div>
  );
}

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-white text-[#1f1f1f]">
      <section className="public-hero-bg relative overflow-hidden px-5 py-6 md:px-8 md:py-8">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#1f1f1f] text-xs font-black text-[#f4b63f]">
              FHC
            </div>
            <span className="text-sm font-semibold">Fa Hui Cu</span>
          </Link>
          <nav className="flex items-center gap-2">
            <button className="hidden rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold text-neutral-700 sm:inline-flex">
              ID
            </button>
            <button className="hidden rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold text-neutral-700 sm:inline-flex">
              中文
            </button>
            <Link
              href="/login"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold shadow-sm"
            >
              Login
            </Link>
          </nav>
        </header>

        <div className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-5xl place-items-center py-10 text-center">
          <div className="w-full">
            <GuangJiMark />
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-[#9a6a00]">廣明佛堂</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Fa Hui Cu
              <br />
              Learning Journey
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-700 md:text-lg">
              {copy.subtitle}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#8a640f]">
              Saat ini sistem berjalan sebagai pilot Fa Hui Cu, bukan sistem penuh untuk 10 divisi.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f4b63f] px-6 text-sm font-black text-[#1f1f1f] shadow-lg shadow-[#f4b63f]/25"
              >
                Register
                <ChevronRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-bold shadow-sm"
              >
                Login anggota
              </Link>
            </div>

            <div className="mx-auto mt-10 max-w-sm">
              <div className="rounded-2xl border border-black/10 bg-white/82 p-4 shadow-sm">
                <UsersRound className="mx-auto text-[#9a6a00]" size={22} />
                <p className="mt-2 text-2xl font-black">148+</p>
                <p className="text-xs font-medium text-neutral-500">anggota terdaftar sebagai user</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-10 md:grid-cols-3 md:px-8">
        <article className="rounded-2xl border border-black/10 bg-[#fff7e8] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Background</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.background}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Visi & Misi</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.vision}</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.mission}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-[#f5f5f5] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Wejangan</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.quote}</p>
        </article>
      </section>

      <section className="border-y border-black/10 bg-[#fff7e8] px-5 py-10 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Member Journey</p>
            <h2 className="mt-2 text-2xl font-black text-[#1f1f1f]">Perjalanan belajar anggota</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-6">
            {journey.map((item, index) => (
              <div key={item} className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-black text-[#9a6a00]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 text-sm font-bold text-[#1f1f1f]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_1.15fr] md:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Cabang</p>
          <h2 className="mt-2 text-2xl font-black text-[#1f1f1f]">Lingkup pilot lintas Fo Thang</h2>
          <div className="mt-5 grid gap-3">
            {branches.map((branch) => (
              <div key={branch.name} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ffe7a3] text-[#1f1f1f]">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#1f1f1f]">{branch.name}</p>
                  <p className="text-sm text-neutral-500">{branch.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Fokus Aktivitas</p>
          <h2 className="mt-2 text-2xl font-black text-[#1f1f1f]">Ruang kerja yang didata bertahap</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {activityFocus.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#f5f5f5] p-4">
                <Sparkles size={18} className="text-[#9a6a00]" />
                <p className="text-sm font-bold text-[#1f1f1f]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
