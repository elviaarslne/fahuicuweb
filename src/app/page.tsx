import Link from "next/link";
import { ChevronRight, UsersRound } from "lucide-react";

const copy = {
  title: "Fa Hui Cu Learning Journey",
  background:
    "Fa Hui Cu adalah Seksi Sidang Dharma, salah satu dari 10 divisi/seksi dalam Guang Ji/Guang Ming. Tahap awal sistem ini difokuskan untuk Fa Hui Cu terlebih dahulu agar alur anggota, kelas, kegiatan, pelayanan, dan refleksi bisa tertata sebelum diperluas.",
  vision:
    "Membina perjalanan belajar Dharma yang tertib, hangat, dan berkesinambungan bagi umat Guang Ji/Guang Ming.",
  mission:
    "Mendukung pengurus Fa Hui Cu dalam mengelola data anggota, kelas, acara, materi, absensi, pelayanan, dan feedback secara jelas, rapi, dan mudah dievaluasi.",
  quote:
    "Belajar Dharma dimulai dari hati yang jernih, lalu diwujudkan dalam pelayanan yang tekun.",
};

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
      <section className="public-hero-bg relative overflow-hidden px-5 py-4 md:px-8 md:py-6">
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

        <div className="mx-auto grid w-full max-w-5xl place-items-center py-4 text-center md:py-5">
          <div className="w-full">
            <GuangJiMark />
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.28em] text-[#9a6a00]">廣明佛堂</p>
            <h1 className="mx-auto mt-2 max-w-4xl text-3xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Fa Hui Cu
              <br />
              Learning Journey
            </h1>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

            <div className="mx-auto mt-5 max-w-sm">
              <div className="rounded-2xl border border-black/10 bg-white/82 p-4 shadow-sm">
                <UsersRound className="mx-auto text-[#9a6a00]" size={22} />
                <p className="mt-2 text-2xl font-black">148+</p>
                <p className="text-xs font-medium text-neutral-500">anggota terdaftar sebagai user</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-6 md:grid-cols-3 md:px-8">
        <article className="rounded-2xl border border-black/10 bg-[#fff7e8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Background</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.background}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Visi & Misi</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.vision}</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.mission}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-[#f5f5f5] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a00]">Wejangan</p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{copy.quote}</p>
        </article>
      </section>
    </main>
  );
}
