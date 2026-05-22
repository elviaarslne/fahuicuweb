import Link from "next/link";
import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(244,198,43,0.16),_transparent_34%),linear-gradient(135deg,#fffdf7_0%,#f8f1de_100%)] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#e8ddc4] bg-[#fffdf7]/95 p-7 shadow-xl shadow-amber-900/10">
        <div className="mx-auto flex justify-center">
          <Image
            src="/images/guangji-logo.png"
            alt="Guang Ji"
            width={116}
            height={116}
            className="h-auto w-28 object-contain"
            priority
          />
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold text-[#1f1f1f]">Masuk ke Fa Hui Cu</h1>
        <p className="mt-2 text-center text-sm text-[#6b6254]">
          Akses internal untuk anggota yang sudah disetujui admin.
        </p>
        <LoginForm />
        <p className="mt-5 text-center text-sm text-[#6b6254]">
          Belum punya akun? <Link className="font-semibold text-[#1f1f1f] underline decoration-[#f4c62b] decoration-2 underline-offset-4 hover:text-[#8a6b00]" href="/register">Daftar anggota</Link>
        </p>
      </section>
    </main>
  );
}
