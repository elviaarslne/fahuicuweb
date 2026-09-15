import Link from "next/link";

export default function WejanganHistoryNav({ previousId, nextId }: { previousId?: string; nextId?: string }) {
  return (
    <div className="flex items-center gap-2">
      {previousId ? (
        <Link href={`/user/wejangan?id=${previousId}`} className="rounded-full border border-[#e8ddc4] bg-white px-3 py-1.5 text-xs font-bold text-[#2f405f] hover:bg-[#fff8e8]">
          Previous
        </Link>
      ) : (
        <span className="rounded-full border border-[#e8ddc4] bg-white/70 px-3 py-1.5 text-xs font-bold text-[#9aa7bd]">Previous</span>
      )}
      {nextId ? (
        <Link href={`/user/wejangan?id=${nextId}`} className="rounded-full border border-[#e8ddc4] bg-white px-3 py-1.5 text-xs font-bold text-[#2f405f] hover:bg-[#fff8e8]">
          Next
        </Link>
      ) : (
        <span className="rounded-full border border-[#e8ddc4] bg-white/70 px-3 py-1.5 text-xs font-bold text-[#9aa7bd]">Next</span>
      )}
    </div>
  );
}
