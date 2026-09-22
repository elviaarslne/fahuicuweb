import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/access-control";
import { branchScopedWhere, getRoleNames } from "@/lib/branch-scope";
import { mcAttendanceScope } from "@/lib/operational-permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const roles = getRoleNames(user);

    let scopeWhere: ReturnType<typeof branchScopedWhere> | null = null;

    if (isAllowed(roles, "manageAttendance")) {
      scopeWhere = branchScopedWhere(user);
    } else if (user) {
      const approvedMcParticipation = await prisma.eventParticipant.findFirst({
        where: { userId: user.id, role: "MC", registrationStatus: "APPROVED" },
        select: { id: true },
      });
      if (approvedMcParticipation) {
        scopeWhere = mcAttendanceScope(user);
      }
    }

    if (!scopeWhere) {
      return NextResponse.json({ error: "Tidak punya akses melihat attendance." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") || undefined;

    const events = await prisma.event.findMany({
      orderBy: { startAt: "desc" },
      include: {
        targetClass: true,
        participants: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
        attendances: {
          include: { user: true },
          orderBy: { checkedInAt: "desc" },
        },
      },
      where: eventId ? { id: eventId, ...scopeWhere } : scopeWhere,
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil attendance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
