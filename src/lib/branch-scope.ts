import { isBranchLeader, isSuperAdmin, isTrainerRole } from "@/lib/access-control";
import { operationalEventRoles } from "@/lib/operational-permissions";
import type { Prisma } from "@prisma/client";

type CurrentUser = {
  id: string;
  homeBranchId: string;
  systemRoles: Array<{ role: string }>;
} | null;

export function getRoleNames(user: CurrentUser) {
  return user?.systemRoles.map((role) => role.role) ?? [];
}

export function branchScopedWhere(user: CurrentUser): Prisma.EventWhereInput {
  const roles = getRoleNames(user);
  if (!user || isSuperAdmin(roles)) return {};
  if (isBranchLeader(roles)) return { hostingBranchId: user.homeBranchId };
  if (isTrainerRole(roles)) {
    return {
      participants: {
        some: {
          userId: user.id,
          role: { in: [...operationalEventRoles] },
        },
      },
    };
  }
  return {
    participants: {
      some: { userId: user.id },
    },
  };
}

export function userScopedWhere(user: CurrentUser): Prisma.UserWhereInput {
  const roles = getRoleNames(user);
  if (!user || isSuperAdmin(roles)) return {};
  if (isBranchLeader(roles)) return { homeBranchId: user.homeBranchId };
  return { id: user.id };
}
