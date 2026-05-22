import { isBranchLeader, isSuperAdmin } from "@/lib/access-control";

type ContentUser = {
  id: string;
  homeBranchId: string;
  systemRoles: Array<{ role: string }>;
} | null;

export function isContentManager(user: ContentUser) {
  if (!user) return false;
  const roles = user.systemRoles.map((role) => role.role);
  return isSuperAdmin(roles) || isBranchLeader(roles);
}

export function requireContentManager(user: ContentUser) {
  if (!isContentManager(user)) {
    throw new Error("Tidak punya akses mengelola konten admin.");
  }
}
