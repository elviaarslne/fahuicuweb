export type AccessRole = "MEMBER" | "TRAINER" | "KETUA" | "ADMIN" | "SUPER_ADMIN";

export type AccessLevel = "allow" | "deny" | "partial";

export type AccessAction =
  | "viewOwnProfile"
  | "editOwnProfile"
  | "viewEvents"
  | "registerEvent"
  | "createEvent"
  | "editEvent"
  | "manageEventParticipants"
  | "manageAttendance"
  | "approveUser"
  | "viewFeedbackSummary"
  | "viewAllMembers"
  | "manageTraining";

export const accessRoles: AccessRole[] = ["MEMBER", "TRAINER", "KETUA", "ADMIN", "SUPER_ADMIN"];

export const accessMatrix: Record<AccessAction, {
  label: string;
  description: string;
  access: Record<AccessRole, AccessLevel>;
}> = {
  viewOwnProfile: {
    label: "View own profile",
    description: "Melihat profil pribadi, kelas, kategori anggota, dan credit pembelajaran sendiri.",
    access: { MEMBER: "allow", TRAINER: "allow", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  editOwnProfile: {
    label: "Edit own profile",
    description: "Mengubah data profil pribadi yang tidak memerlukan approval ulang.",
    access: { MEMBER: "allow", TRAINER: "allow", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  viewEvents: {
    label: "View events",
    description: "Melihat Sidang Dharma dan Training sebagai domain operasional yang terpisah.",
    access: { MEMBER: "allow", TRAINER: "allow", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  registerEvent: {
    label: "Register event",
    description: "Mendaftar Sidang Dharma yang dibuka. Training memakai enrollment batch terpisah saat modul Training aktif.",
    access: { MEMBER: "allow", TRAINER: "allow", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  createEvent: {
    label: "Create event",
    description: "Membuat dan mengelola Sidang Dharma. Training memakai workflow batch terpisah.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  editEvent: {
    label: "Edit event",
    description: "Mengubah detail Sidang Dharma, lifecycle, peserta, QR attendance, dan materi terkait.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  manageEventParticipants: {
    label: "Manage event participants",
    description: "Menetapkan user ke role Sidang Dharma seperti attendee, coordinator, MC, speaker, atau pengawas.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  manageAttendance: {
    label: "Manage attendance",
    description: "Melihat absensi event dan melakukan koreksi manual present, late, absent, atau excused.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  approveUser: {
    label: "Approve user",
    description: "Menerima, menolak, menonaktifkan user, dan menetapkan kelas/kategori anggota.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "deny", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  viewFeedbackSummary: {
    label: "View feedback summary",
    description: "Melihat ringkasan feedback acara dan purpose achievement score.",
    access: { MEMBER: "deny", TRAINER: "partial", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  viewAllMembers: {
    label: "View all members",
    description: "Melihat database anggota dan pendaftar.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "partial", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
  manageTraining: {
    label: "Manage training",
    description: "Membuat dan mengelola program, batch, dan sesi Training. Terpisah dari workflow Sidang Dharma.",
    access: { MEMBER: "deny", TRAINER: "deny", KETUA: "allow", ADMIN: "allow", SUPER_ADMIN: "allow" },
  },
};

export function normalizeAccessRole(roles: string[]): AccessRole {
  if (roles.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("KETUA") || roles.includes("SUB_KETUA")) return "KETUA";
  if (roles.includes("TRAINER") || roles.includes("SPEAKER")) return "TRAINER";
  return "MEMBER";
}

export function isSuperAdmin(roles: string[]) {
  return roles.includes("SUPER_ADMIN");
}

export function isBranchLeader(roles: string[]) {
  return roles.includes("KETUA") || roles.includes("SUB_KETUA") || roles.includes("ADMIN");
}

export function isTrainerRole(roles: string[]) {
  return roles.includes("TRAINER") || roles.includes("SPEAKER");
}

export function canAccess(roles: string[], action: AccessAction) {
  const role = normalizeAccessRole(roles);
  return accessMatrix[action].access[role];
}

export function isAllowed(roles: string[], action: AccessAction) {
  return canAccess(roles, action) === "allow";
}
