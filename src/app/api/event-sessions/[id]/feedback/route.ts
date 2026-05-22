import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const feedbackSchema = z.object({
  speakerClarityRating: z.coerce.number().int().min(1).max(5),
  materialUsefulnessRating: z.coerce.number().int().min(1).max(5),
  topicRelevanceRating: z.coerce.number().int().min(1).max(5),
  learnedText: z.string().min(2),
  benefitText: z.string().min(2),
  improvementText: z.string().min(2),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const { id } = await params;
    const feedback = await prisma.topicFeedback.findUnique({
      where: { eventSessionId_userId: { eventSessionId: id, userId: user.id } },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil feedback sesi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const parsed = feedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data feedback topik tidak valid." }, { status: 400 });
    }

    const { id } = await params;
    const session = await prisma.eventSession.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            participants: { where: { userId: user.id, registrationStatus: "APPROVED" } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }

    if (session.event.participants.length === 0) {
      return NextResponse.json({ error: "Feedback sesi hanya untuk peserta yang sudah approved." }, { status: 403 });
    }

    const feedback = await prisma.topicFeedback.upsert({
      where: { eventSessionId_userId: { eventSessionId: id, userId: user.id } },
      update: parsed.data,
      create: { ...parsed.data, eventSessionId: id, userId: user.id },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan feedback sesi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
