import { isBranchLeader, isSuperAdmin } from "@/lib/access-control";
import { canUploadMaterialForEvent } from "@/lib/operational-permissions";

type CurrentUser = {
  id: string;
  homeBranchId: string;
  systemRoles: Array<{ role: string }>;
} | null;

export function roleNames(user: CurrentUser) {
  return user?.systemRoles.map((role) => role.role) ?? [];
}

export function canManageBranchResource(user: CurrentUser, branchId: string | null | undefined) {
  const roles = roleNames(user);
  if (!user) return false;
  if (isSuperAdmin(roles)) return true;
  return isBranchLeader(roles) && user.homeBranchId === branchId;
}

export function canViewMemberProfile(user: CurrentUser, member: {
  id: string;
  homeBranchId: string;
  eventParticipants?: Array<{
    eventId: string;
    event?: { hostingBranchId: string };
  }>;
}, pengawasEventIds: string[] = []) {
  if (!user) return false;
  if (user.id === member.id) return true;
  if (canManageBranchResource(user, member.homeBranchId)) return true;
  if (isSuperAdmin(roleNames(user))) return true;

  return Boolean(
    member.eventParticipants?.some((participant) => pengawasEventIds.includes(participant.eventId)),
  );
}

export function canManageEventResource(user: CurrentUser, event: {
  hostingBranchId: string;
  participants?: Array<{ userId: string; role: string; registrationStatus?: string }>;
  sessions?: Array<{ speakerId?: string | null; trainerId?: string | null }>;
}) {
  return canUploadMaterialForEvent(user, event);
}

export function canViewEventResource(user: CurrentUser, event: {
  hostingBranchId: string;
  participants?: Array<{ userId: string; role: string; registrationStatus?: string }>;
}) {
  if (!user) return false;
  if (canManageBranchResource(user, event.hostingBranchId)) return true;
  return Boolean(
    event.participants?.some((participant) =>
      participant.userId === user.id &&
      participant.registrationStatus === "APPROVED",
    ),
  );
}
