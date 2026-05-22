const styles: Record<string, string> = {
  Active: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  Pending: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  Published: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  Draft: "bg-[#f8f1de] text-[#6b6254] ring-[#e8ddc4]",
  Completed: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  APPROVED: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  REQUESTED: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  ACTIVE: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  INACTIVE: "bg-[#f8f1de] text-[#6b6254] ring-[#e8ddc4]",
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[value] ?? styles.Draft}`}>
      {value}
    </span>
  );
}
