import Link from "next/link";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="surface w-full max-w-2xl rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-[#1f1f1f]">Pendaftaran anggota</h1>
        <RegisterForm />
        <p className="mt-5 text-sm text-neutral-500">
          Sudah punya akun? <Link className="font-semibold text-[#1f1f1f]" href="/login">Masuk</Link>
        </p>
      </section>
    </main>
  );
}
