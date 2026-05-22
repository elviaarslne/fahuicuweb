import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/access-control";
import { branchScopedWhere, getRoleNames } from "@/lib/branch-scope";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

async function requireAttendanceAccess() {
  const user = await getCurrentUser();
  const roles = getRoleNames(user);
  return { user, roles, allowed: isAllowed(roles, "manageAttendance") };
}

export async function GET(request: Request) {
  try {
    const access = await requireAttendanceAccess();
    if (!access.allowed) {
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
      where: eventId ? { id: eventId, ...branchScopedWhere(access.user) } : branchScopedWhere(access.user),
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil attendance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
