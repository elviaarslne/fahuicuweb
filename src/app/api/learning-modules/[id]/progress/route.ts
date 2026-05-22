import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const progressSchema = z.object({
  isCompleted: z.boolean().default(false),
  completedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const parsed = progressSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data progress tidak valid." }, { status: 400 });
    }

    const { id } = await params;
    const completedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : parsed.data.isCompleted ? new Date() : null;
    const progress = await prisma.learningModuleProgress.upsert({
      where: { userId_moduleId: { userId: user.id, moduleId: id } },
      update: {
        isCompleted: parsed.data.isCompleted,
        completedAt,
        notes: parsed.data.notes || null,
        photoUrl: parsed.data.photoUrl || null,
      },
      create: {
        userId: user.id,
        moduleId: id,
        isCompleted: parsed.data.isCompleted,
        completedAt,
        notes: parsed.data.notes || null,
        photoUrl: parsed.data.photoUrl || null,
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan progress modul.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
