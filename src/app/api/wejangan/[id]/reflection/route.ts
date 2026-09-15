import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isSameJakartaDay } from "@/lib/jakarta-time";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const reflectionSchema = z.object({
  answer: z.string().min(2),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const parsed = reflectionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Isi refleksi belum valid." }, { status: 400 });
    }

    const { id } = await params;
    const wejangan = await prisma.dailyWejangan.findUnique({ where: { id } });
    if (!wejangan) {
      return NextResponse.json({ error: "Wejangan tidak ditemukan." }, { status: 404 });
    }

    if (!isSameJakartaDay(wejangan.uploadDate)) {
      return NextResponse.json({ error: "Refleksi hanya bisa diisi untuk wejangan hari ini." }, { status: 403 });
    }

    // Race-safe: try create first (atomic INSERT). If a reflection already
    // exists (created just now by a duplicate/racing submit, or earlier
    // today), fall back to update instead of crashing on the unique
    // constraint (wejangan_id, user_id).
    let isNew = true;
    let reflection;
    try {
      reflection = await prisma.wejanganReflection.create({
        data: {
          wejanganId: id,
          userId: user.id,
          answer: parsed.data.answer,
          creditAwarded: wejangan.creditReward,
        },
      });
    } catch (error) {
      const isDuplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!isDuplicate) throw error;
      isNew = false;
      reflection = await prisma.wejanganReflection.update({
        where: { wejanganId_userId: { wejanganId: id, userId: user.id } },
        data: { answer: parsed.data.answer },
      });
    }

    if (isNew) {
      const account = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { creditBalance: true },
      });
      const balanceAfter = account.creditBalance + wejangan.creditReward;
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { creditBalance: balanceAfter },
        }),
        prisma.creditLedger.create({
          data: {
            userId: user.id,
            type: "EARNED",
            source: "WEJANGAN_REFLECTION",
            amount: wejangan.creditReward,
            balanceBefore: account.creditBalance,
            balanceAfter,
            referenceId: reflection.id,
            note: `Refleksi wejangan: ${wejangan.title}`,
          },
        }),
      ]);
    }

    return NextResponse.json({
      reflection,
      creditAwarded: isNew ? wejangan.creditReward : 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan refleksi wejangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
