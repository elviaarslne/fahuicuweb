import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SettingsPageHeader({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <Link
        href="/settings"
        aria-label="Kembali ke Pengaturan"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-[#e8ddc4] bg-white text-[#1f1f1f] shadow-sm"
      >
        <ChevronLeft size={18} />
      </Link>
      <h1 className="text-xl font-semibold text-[#1f1f1f]">{title}</h1>
    </div>
  );
}
