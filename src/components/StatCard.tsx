import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#6b6254]">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-[#1f1f1f]">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-full bg-[#fff8e8] text-[#a17700] ring-1 ring-[#e8ddc4]">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs text-[#6b6254]">{detail}</p>
    </div>
  );
}
