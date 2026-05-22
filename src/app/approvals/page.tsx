import AppChrome from "@/components/AppChrome";
import ApprovalQueue from "@/app/dashboard/ApprovalQueue";

export default function ApprovalCenterPage() {
  return (
    <AppChrome>
      <section className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Admin End</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1f1f1f]">Approval Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
            Queue approval anggota, registrasi lintas cabang, dan approval peserta yang menjadi tanggung jawab MC event.
          </p>
        </div>
        <ApprovalQueue />
      </section>
    </AppChrome>
  );
}
