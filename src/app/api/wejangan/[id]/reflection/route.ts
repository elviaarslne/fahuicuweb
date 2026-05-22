import { NextResponse } from "next/server";
import { z } from "zod";
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

    const existing = await prisma.wejanganReflection.findUnique({
      where: { wejanganId_userId: { wejanganId: id, userId: user.id } },
    });

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { creditBalance: true },
      });

      const reflection = existing
        ? await tx.wejanganReflection.update({
            where: { id: existing.id },
            data: { answer: parsed.data.answer },
          })
        : await tx.wejanganReflection.create({
            data: {
              wejanganId: id,
              userId: user.id,
              answer: parsed.data.answer,
              creditAwarded: wejangan.creditReward,
            },
          });

      if (!existing) {
        const balanceAfter = account.creditBalance + wejangan.creditReward;
        await tx.user.update({
          where: { id: user.id },
          data: { creditBalance: balanceAfter },
        });
        await tx.creditLedger.create({
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
        });
      }

      return reflection;
    });

    return NextResponse.json({
      reflection: result,
      creditAwarded: existing ? 0 : wejangan.creditReward,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan refleksi wejangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
