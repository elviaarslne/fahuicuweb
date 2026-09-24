export const eventStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FEEDBACK_COLLECTION", label: "Feedback Collection" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const eventRoleOptions = [
  { value: "ATTENDEE", label: "Peserta / Attendee" },
  { value: "COORDINATOR", label: "Koordinator" },
  { value: "MC", label: "MC / Event Planner" },
  { value: "TRAINER", label: "Trainer" },
  { value: "SPEAKER", label: "Speaker / Penceramah" },
  { value: "PENGAWAS", label: "Pengawas / Dao Wu Zu" },
];

export const speakerCategoryOptions = [
  { value: "BAN_SHI_JEN_YUAN", label: "Ban Shi Jen Yuan / Pengabdi" },
  { value: "JIANG_YUAN", label: "Jiang Yuan / Penceramah Junior" },
  { value: "TAN_ZHU", label: "Tan Zhu / Tuan Rumah Vihara" },
  { value: "JIANG_SHI", label: "Jiang Shi / Penceramah Senior" },
];

export const registrationStatusOptions = [
  { value: "PENDING_APPROVAL", label: "Menunggu persetujuan" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "CANCELLED", label: "Dibatalkan" },
] as const;

export const attendanceStatusOptions = [
  { value: "NOT_CHECKED_IN", label: "Belum check-in" },
  { value: "PRESENT", label: "Hadir" },
  { value: "LATE", label: "Terlambat" },
  { value: "ABSENT", label: "Tidak hadir" },
  { value: "EXCUSED", label: "Izin" },
] as const;

export const eventLifecycle = eventStatusOptions.map((item) => item.value);

export type EventLifecycleStatus = (typeof eventStatusOptions)[number]["value"];

export function getEventStatusLabel(status: string) {
  return eventStatusOptions.find((item) => item.value === status)?.label || status;
}

export function getEventRoleLabel(role: string) {
  return eventRoleOptions.find((item) => item.value === role)?.label || role;
}

export function getRegistrationStatusLabel(status: string | null | undefined) {
  if (!status) return "";
  return registrationStatusOptions.find((item) => item.value === status)?.label || status;
}

export function getAttendanceStatusLabel(status: string) {
  return attendanceStatusOptions.find((item) => item.value === status)?.label || status;
}

export function getSpeakerCategoryLabel(value: string | null | undefined) {
  if (!value) return "";
  return speakerCategoryOptions.find((item) => item.value === value)?.label || value;
}

export function getNextEventStatus(status: string) {
  const index = eventLifecycle.indexOf(status as EventLifecycleStatus);
  if (index < 0 || index >= eventLifecycle.length - 1) return null;
  return eventLifecycle[index + 1];
}

export function canAdvanceEventStatus(fromStatus: string, toStatus: string) {
  return getNextEventStatus(fromStatus) === toStatus;
}
