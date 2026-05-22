import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const reflectionSchema = z.object({
  eventId: z.string().min(1),
  overallImpression: z.string().min(2),
  mainLearning: z.string().min(2),
  suggestion: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const parsed = reflectionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data refleksi event tidak valid." }, { status: 400 });
    }

    const participant = await prisma.eventParticipant.findFirst({
      where: {
        userId: user.id,
        eventId: parsed.data.eventId,
        registrationStatus: "APPROVED",
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Refleksi hanya untuk peserta approved." }, { status: 403 });
    }

    const reflection = await prisma.eventReflection.upsert({
      where: { eventId_userId: { eventId: parsed.data.eventId, userId: user.id } },
      update: {
        overallImpression: parsed.data.overallImpression,
        mainLearning: parsed.data.mainLearning,
        suggestion: parsed.data.suggestion || null,
      },
      create: {
        eventId: parsed.data.eventId,
        userId: user.id,
        overallImpression: parsed.data.overallImpression,
        mainLearning: parsed.data.mainLearning,
        suggestion: parsed.data.suggestion || null,
      },
    });

    return NextResponse.json({ reflection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan refleksi event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
