import type { Prisma } from "@prisma/client";
import { isAllowed } from "@/lib/access-control";

export const operationalEventRoles = ["COORDINATOR", "MC", "PENGAWAS", "SPEAKER", "TRAINER"] as const;
export const approvalEventRoles = ["MC"] as const;
export const attendanceCorrectionRoles = ["MC"] as const;
export const materialContributorRoles = ["SPEAKER", "TRAINER"] as const;

function getRoleNames(user: CurrentUser) {
  return user?.systemRoles.map((role) => role.role) ?? [];
}

type CurrentUser = {
  id: string;
  homeBranchId: string;
  systemRoles: Array<{ role: string }>;
} | null;

type AssignedParticipant = {
  userId: string;
  role: string;
  registrationStatus?: string | null;
};

type EventWithAssignments = {
  hostingBranchId?: string | null;
  participants?: AssignedParticipant[];
  sessions?: Array<{ speakerId?: string | null; trainerId?: string | null }>;
};

export function isKetuaLevel(roles: string[]) {
  return roles.some((role) => ["SUPER_ADMIN", "ADMIN", "KETUA", "SUB_KETUA"].includes(role));
}

export function isBranchAdminLevel(roles: string[]) {
  return roles.some((role) => ["SUPER_ADMIN", "ADMIN", "KETUA", "SUB_KETUA"].includes(role));
}

export function hasApprovedEventRole(
  user: CurrentUser,
  event: EventWithAssignments | null | undefined,
  allowedRoles: readonly string[],
) {
  if (!user || !event?.participants) return false;
  return event.participants.some(
    (participant) =>
      participant.userId === user.id &&
      allowedRoles.includes(participant.role) &&
      participant.registrationStatus !== "REJECTED" &&
      participant.registrationStatus !== "CANCELLED",
  );
}

export function canOperateEventByBranchOrAssignment(
  user: CurrentUser,
  event: EventWithAssignments | null | undefined,
  assignmentRoles: readonly string[],
) {
  if (!user || !event) return false;
  const roles = getRoleNames(user);
  if (roles.includes("SUPER_ADMIN")) return true;
  if (isBranchAdminLevel(roles) && user.homeBranchId === event.hostingBranchId) return true;
  return hasApprovedEventRole(user, event, assignmentRoles);
}

export function canApproveParticipantForEvent(user: CurrentUser, event: EventWithAssignments | null | undefined) {
  if (!user || !event) return false;
  const roles = getRoleNames(user);
  if (isAllowed(roles, "manageEventParticipants")) {
    return roles.includes("SUPER_ADMIN") || user.homeBranchId === event.hostingBranchId;
  }
  return hasApprovedEventRole(user, event, approvalEventRoles);
}

export function canCorrectAttendanceForEvent(user: CurrentUser, event: EventWithAssignments | null | undefined) {
  if (!user || !event) return false;
  const roles = getRoleNames(user);
  if (isAllowed(roles, "manageAttendance")) {
    return roles.includes("SUPER_ADMIN") || user.homeBranchId === event.hostingBranchId;
  }
  return hasApprovedEventRole(user, event, attendanceCorrectionRoles);
}

export function canUploadMaterialForEvent(user: CurrentUser, event: EventWithAssignments | null | undefined) {
  if (!user || !event) return false;
  const roles = getRoleNames(user);
  if (roles.includes("SUPER_ADMIN")) return true;
  if (isBranchAdminLevel(roles) && user.homeBranchId === event.hostingBranchId) return true;
  if (hasApprovedEventRole(user, event, materialContributorRoles)) return true;
  return Boolean(event.sessions?.some((session) => session.speakerId === user.id || session.trainerId === user.id));
}

export function mcAttendanceScope(user: NonNullable<CurrentUser>): Prisma.EventWhereInput {
  return {
    participants: {
      some: {
        userId: user.id,
        role: { in: [...attendanceCorrectionRoles] },
        registrationStatus: "APPROVED",
      },
    },
  };
}

export function operationalEventScope(user: CurrentUser): Prisma.EventWhereInput {
  const roles = getRoleNames(user);
  if (!user || roles.includes("SUPER_ADMIN")) return {};
  if (isBranchAdminLevel(roles)) return { hostingBranchId: user.homeBranchId };
  return {
    participants: {
      some: {
        userId: user.id,
        role: { in: [...operationalEventRoles] },
      },
    },
  };
}

export function assignedMcParticipantApprovalScope(user: NonNullable<CurrentUser>): Prisma.EventParticipantWhereInput {
  const roles = getRoleNames(user);
  if (roles.includes("SUPER_ADMIN")) return { registrationStatus: "PENDING_APPROVAL" };
  if (isAllowed(roles, "manageEventParticipants")) {
    return { registrationStatus: "PENDING_APPROVAL", event: { hostingBranchId: user.homeBranchId } };
  }
  return {
    registrationStatus: "PENDING_APPROVAL",
    event: {
      participants: {
        some: {
          userId: user.id,
          role: { in: [...approvalEventRoles] },
          registrationStatus: "APPROVED",
        },
      },
    },
  };
}
