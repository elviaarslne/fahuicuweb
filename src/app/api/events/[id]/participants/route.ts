import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowed } from "@/lib/access-control";
import { getRoleNames } from "@/lib/branch-scope";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const participantSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ATTENDEE", "COORDINATOR", "MC", "TRAINER", "SPEAKER", "PENGAWAS"]),
  speakerCategory: z.enum(["BAN_SHI_JEN_YUAN", "JIANG_YUAN", "TAN_ZHU", "JIANG_SHI"]).nullable().optional(),
});

async function requireParticipantAccess() {
  const user = await getCurrentUser();
  const roles = getRoleNames(user);
  return { user, roles, allowed: isAllowed(roles, "manageEventParticipants") };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireParticipantAccess();
    if (!access.allowed) {
      return NextResponse.json({ error: "Tidak punya akses mengatur participant event." }, { status: 403 });
    }

    const { id: eventId } = await params;
    const parsed = participantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data participant tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    }

    if (!access.roles.includes("SUPER_ADMIN") && access.user?.homeBranchId !== event.hostingBranchId) {
      return NextResponse.json({ error: "Participant event cabang lain tidak boleh diubah." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "User harus aktif sebelum dimasukkan ke event." }, { status: 400 });
    }

    if (!access.roles.includes("SUPER_ADMIN") && user.homeBranchId !== event.hostingBranchId) {
      return NextResponse.json({ error: "User harus berasal dari cabang event yang sama." }, { status: 400 });
    }

    if (data.role === "COORDINATOR" && !user.isCoordinatorEligible) {
      return NextResponse.json({ error: "Koordinator hanya boleh dipilih dari anggota Fa Hui Cu terpilih." }, { status: 400 });
    }

    const participant = await prisma.eventParticipant.upsert({
      where: {
        userId_eventId_role: {
          userId: data.userId,
          eventId,
          role: data.role,
        },
      },
      update: {
        speakerCategory: data.role === "SPEAKER" ? data.speakerCategory ?? null : null,
        registrationStatus: "APPROVED",
        approvedByUserId: access.user?.id,
        approvedAt: new Date(),
      },
      create: {
        userId: data.userId,
        eventId,
        role: data.role,
        registrationStatus: "APPROVED",
        approvedByUserId: access.user?.id,
        approvedAt: new Date(),
        speakerCategory: data.role === "SPEAKER" ? data.speakerCategory ?? null : null,
      },
      include: { user: true },
    });

    await prisma.eventAttendance.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: data.userId,
        },
      },
      update: {},
      create: {
        eventId,
        userId: data.userId,
        status: "NOT_CHECKED_IN",
        source: "MANUAL",
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah participant.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
