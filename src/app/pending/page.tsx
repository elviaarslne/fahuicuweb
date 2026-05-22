import Link from "next/link";
import { Clock3 } from "lucide-react";

export default function PendingPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="surface max-w-lg rounded-lg p-7 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-lg bg-[#ffe7a3] text-[#1f1f1f]">
          <Clock3 size={26} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-[#1f1f1f]">Menunggu persetujuan admin</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Terima kasih sudah mendaftar. Admin Fa Hui Cu akan memeriksa data, menentukan kelas saat ini,
          dan mengaktifkan akses Anda.
        </p>
        <Link className="mt-6 inline-flex rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white" href="/login">
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}
