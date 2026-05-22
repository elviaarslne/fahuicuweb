import { NextResponse } from "next/server";
import { z } from "zod";
import { canApproveParticipantForEvent } from "@/lib/operational-permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const approvalSchema = z.object({
  registrationStatus: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Hanya MC/Pengawas/Admin/Ketua yang dapat approve registrasi." }, { status: 403 });
    }

    const { id } = await params;
    const parsed = approvalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Status approval tidak valid." }, { status: 400 });
    }

    const participant = await prisma.eventParticipant.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant tidak ditemukan." }, { status: 404 });
    }

    if (!canApproveParticipantForEvent(currentUser, participant.event)) {
      return NextResponse.json({ error: "Hanya MC event atau pengurus berwenang yang dapat approve registrasi." }, { status: 403 });
    }

    const updated = await prisma.eventParticipant.update({
      where: { id },
      data: {
        registrationStatus: parsed.data.registrationStatus,
        approvedByUserId: parsed.data.registrationStatus === "APPROVED" ? currentUser.id : null,
        approvedAt: parsed.data.registrationStatus === "APPROVED" ? new Date() : null,
      },
      include: { user: true, event: true, approvedByUser: true },
    });

    return NextResponse.json({ participant: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update approval registrasi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
