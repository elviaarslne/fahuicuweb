import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const roles = user?.systemRoles.map((role) => role.role) ?? [];
    if (!isAllowed(roles, "viewSchedule")) {
      return NextResponse.json({ error: "Tidak punya akses melihat jadwal." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const program = searchParams.get("program") || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const q = searchParams.get("q")?.trim() || undefined;

    const where: Record<string, unknown> = {};
    if (program) where.program = program;
    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { titleZh: { contains: q } },
        { titleId: { contains: q } },
        { instructorName: { contains: q } },
      ];
    }

    const canManage = isAllowed(roles, "manageSchedule");

    const entries = await prisma.scheduleEntry.findMany({
      where,
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        titleZh: true,
        titleId: true,
        instructorName: true,
        program: true,
        classLabel: true,
        startTime: true,
        endTime: true,
        linkedEventId: true,
        ...(canManage
          ? { sourceSheet: true, sourceRow: true, duplicateStatus: true }
          : {}),
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil jadwal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
