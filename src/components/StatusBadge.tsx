const styles: Record<string, string> = {
  // Neutral / not-yet-started
  Active: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  Draft: "bg-[#f8f1de] text-[#6b6254] ring-[#e8ddc4]",
  DRAFT: "bg-[#f8f1de] text-[#6b6254] ring-[#e8ddc4]",
  INACTIVE: "bg-[#f8f1de] text-[#6b6254] ring-[#e8ddc4]",
  NOT_CHECKED_IN: "bg-[#f8f1de] text-[#6b6254] ring-[#e8ddc4]",
  // In progress / needs attention
  Pending: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  Published: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  PUBLISHED: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  REGISTRATION_OPEN: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  ONGOING: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  FEEDBACK_COLLECTION: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  PENDING_APPROVAL: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  REQUESTED: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  LATE: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  EXCUSED: "bg-[#fff8e8] text-[#a17700] ring-[#e8ddc4]",
  // Completed / approved
  Completed: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  COMPLETED: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  ARCHIVED: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  APPROVED: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  ACTIVE: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  PRESENT: "bg-[#e9f4ef] text-[#2e7d61] ring-[#b9d8c9]",
  // Rejected / negative
  REJECTED: "bg-[#fdecea] text-[#c62828] ring-[#f3c6c2]",
  CANCELLED: "bg-[#fdecea] text-[#c62828] ring-[#f3c6c2]",
  ABSENT: "bg-[#fdecea] text-[#c62828] ring-[#f3c6c2]",
};

export default function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[value] ?? styles.Draft}`}>
      {label ?? value}
    </span>
  );
}
