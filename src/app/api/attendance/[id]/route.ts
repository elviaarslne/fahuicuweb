import { NextResponse } from "next/server";
import { z } from "zod";
import { canCorrectAttendanceForEvent } from "@/lib/operational-permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const manualAttendanceSchema = z.object({
  status: z.enum(["NOT_CHECKED_IN", "PRESENT", "LATE", "ABSENT", "EXCUSED"]),
  notes: z.string().nullable().optional(),
});

async function getAttendanceAccess() {
  const user = await getCurrentUser();
  return { user };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAttendanceAccess();
    if (!access.user) {
      return NextResponse.json({ error: "Tidak punya akses koreksi attendance." }, { status: 403 });
    }

    const { id } = await params;
    const parsed = manualAttendanceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data attendance tidak valid." }, { status: 400 });
    }

    const currentAttendance = await prisma.eventAttendance.findUnique({
      where: { id },
      select: {
        checkedInAt: true,
        event: {
          select: {
            hostingBranchId: true,
            participants: true,
          },
        },
      },
    });

    if (!currentAttendance) {
      return NextResponse.json({ error: "Attendance tidak ditemukan." }, { status: 404 });
    }

    if (!canCorrectAttendanceForEvent(access.user, currentAttendance.event)) {
      return NextResponse.json({ error: "Hanya MC event atau pengurus berwenang yang dapat koreksi attendance." }, { status: 403 });
    }

    const shouldHaveCheckIn = ["PRESENT", "LATE"].includes(parsed.data.status);
    const attendance = await prisma.eventAttendance.update({
      where: { id },
      data: {
        status: parsed.data.status,
        source: "MANUAL",
        notes: parsed.data.notes ?? null,
        checkedInAt: shouldHaveCheckIn ? currentAttendance.checkedInAt ?? new Date() : null,
      },
      include: { event: true, user: true },
    });

    await prisma.eventParticipant.updateMany({
      where: { eventId: attendance.eventId, userId: attendance.userId },
      data: {
        attendanceStatus: attendance.status,
        checkedInAt: attendance.checkedInAt,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal koreksi attendance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
