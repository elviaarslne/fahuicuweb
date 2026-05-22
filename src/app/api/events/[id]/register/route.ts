import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan untuk daftar event." }, { status: 401 });
    }

    const roles = user.systemRoles.map((role) => role.role);
    if (!isAllowed(roles, "registerEvent")) {
      return NextResponse.json({ error: "Tidak punya akses daftar event." }, { status: 403 });
    }

    const { id: eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    }

    if (!["PUBLISHED", "REGISTRATION_OPEN"].includes(event.status)) {
      return NextResponse.json({ error: "Registrasi event belum dibuka." }, { status: 400 });
    }

    const sameBranch = user.homeBranchId === event.hostingBranchId;
    const registrationStatus = sameBranch ? "APPROVED" : "PENDING_APPROVAL";
    const existingParticipant = await prisma.eventParticipant.findUnique({
      where: {
        userId_eventId_role: {
          userId: user.id,
          eventId,
          role: "ATTENDEE",
        },
      },
    });
    const shouldKeepApproved = existingParticipant?.registrationStatus === "APPROVED";
    const nextRegistrationStatus = shouldKeepApproved ? "APPROVED" : registrationStatus;

    const participant = await prisma.eventParticipant.upsert({
      where: {
        userId_eventId_role: {
          userId: user.id,
          eventId,
          role: "ATTENDEE",
        },
      },
      update: {
        registrationStatus: nextRegistrationStatus,
        approvedByUserId: shouldKeepApproved ? existingParticipant.approvedByUserId : sameBranch ? user.id : null,
        approvedAt: shouldKeepApproved ? existingParticipant.approvedAt : sameBranch ? new Date() : null,
      },
      create: {
        userId: user.id,
        eventId,
        role: "ATTENDEE",
        registrationStatus: nextRegistrationStatus,
        approvedByUserId: sameBranch ? user.id : null,
        approvedAt: sameBranch ? new Date() : null,
      },
      include: {
        event: { include: { hostingBranch: true } },
        user: { include: { homeBranch: true } },
      },
    });

    await prisma.eventAttendance.upsert({
      where: {
        eventId_userId: { eventId, userId: user.id },
      },
      update: {},
      create: {
        eventId,
        userId: user.id,
        status: "NOT_CHECKED_IN",
        source: "MANUAL",
      },
    });

    return NextResponse.json({
      participant,
      registrationStatus: nextRegistrationStatus,
      message: sameBranch
        ? "Registrasi otomatis approved."
        : shouldKeepApproved
          ? "Registrasi lintas cabang sudah approved."
          : "Registrasi lintas cabang menunggu approval Pengawas.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal daftar event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
