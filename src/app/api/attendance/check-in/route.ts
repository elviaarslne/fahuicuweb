import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const checkInSchema = z.object({
  qrToken: z.string().min(1),
});

const checkInStatuses = ["REGISTRATION_OPEN", "ONGOING"];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login dahulu untuk check-in." }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun harus aktif sebelum bisa check-in." }, { status: 403 });
    }

    const parsed = checkInSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "QR token tidak valid." }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { qrToken: parsed.data.qrToken },
      include: {
        attendances: {
          where: { userId: user.id },
          take: 1,
        },
        participants: {
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "QR event tidak ditemukan." }, { status: 404 });
    }

    if (!checkInStatuses.includes(event.status)) {
      return NextResponse.json(
        { error: "Check-in hanya dibuka saat event Registration Open atau Ongoing." },
        { status: 400 },
      );
    }

    const approvedParticipant = event.participants.find((participant) => participant.registrationStatus === "APPROVED");
    if (!approvedParticipant) {
      return NextResponse.json({ error: "Check-in hanya untuk participant yang registrasinya sudah APPROVED." }, { status: 403 });
    }

    const now = new Date();
    const existingAttendance = event.attendances[0];

    if (existingAttendance?.checkedInAt) {
      return NextResponse.json({
        attendance: existingAttendance,
        event,
        alreadyCheckedIn: true,
        message: "Anda sudah check-in untuk event ini.",
      });
    }

    const participant = approvedParticipant;

    await prisma.eventParticipant.updateMany({
      where: { eventId: event.id, userId: user.id, registrationStatus: "APPROVED" },
      data: {
        attendanceStatus: "PRESENT",
        checkedInAt: now,
      },
    });

    if (existingAttendance) {
      const updated = await prisma.eventAttendance.updateMany({
        where: {
          id: existingAttendance.id,
          checkedInAt: null,
        },
        data: {
          status: "PRESENT",
          source: "QR",
          checkedInAt: now,
          notes: null,
        },
      });

      if (updated.count === 0) {
        const attendance = await prisma.eventAttendance.findUnique({
          where: { id: existingAttendance.id },
          include: { event: true, user: true },
        });

        return NextResponse.json({
          attendance,
          event,
          alreadyCheckedIn: true,
          message: "Anda sudah check-in untuk event ini.",
        });
      }
    } else {
      try {
        await prisma.eventAttendance.create({
          data: {
            eventId: event.id,
            userId: user.id,
            status: "PRESENT",
            source: "QR",
            checkedInAt: now,
          },
        });
      } catch {
        const attendance = await prisma.eventAttendance.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: user.id,
            },
          },
          include: { event: true, user: true },
        });

        return NextResponse.json({
          attendance,
          event,
          alreadyCheckedIn: true,
          message: "Anda sudah check-in untuk event ini.",
        });
      }
    }

    const attendance = await prisma.eventAttendance.findUniqueOrThrow({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: user.id,
        },
      },
      include: { event: true, user: true },
    });

    return NextResponse.json({
      attendance,
      participant,
      walkInCreated: false,
      alreadyCheckedIn: false,
      message: "Check-in berhasil dicatat.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal check-in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
