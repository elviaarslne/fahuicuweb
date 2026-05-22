import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/access-control";
import { getRoleNames, userScopedWhere } from "@/lib/branch-scope";
import { assignedMcParticipantApprovalScope } from "@/lib/operational-permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const roles = getRoleNames(user);
    const canApproveUsers = user && isAllowed(roles, "approveUser");
    const canManageParticipants = user && isAllowed(roles, "manageEventParticipants");

    if (!user) {
      return NextResponse.json({ error: "Tidak punya akses approval queue." }, { status: 403 });
    }

    const participantApprovalWhere = assignedMcParticipantApprovalScope(user);

    const [pendingUsers, pendingCrossBranch] = await Promise.all([
      canApproveUsers
        ? prisma.user.findMany({
            where: { status: "PENDING", ...userScopedWhere(user) },
            orderBy: { createdAt: "asc" },
            include: { homeBranch: true, currentClass: true },
          })
        : [],
      canManageParticipants || !canApproveUsers
        ? prisma.eventParticipant.findMany({
            where: participantApprovalWhere,
            orderBy: { createdAt: "asc" },
            include: {
              user: { include: { homeBranch: true, currentClass: true } },
              event: { include: { hostingBranch: true, targetClass: true } },
            },
          })
        : [],
    ]);

    return NextResponse.json({ pendingUsers, pendingCrossBranch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil approval queue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
