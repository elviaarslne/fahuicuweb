import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const { id } = await params;
    const result = await prisma.$transaction(async (tx) => {
      const [account, reward] = await Promise.all([
        tx.user.findUnique({ where: { id: user.id }, select: { creditBalance: true } }),
        tx.reward.findUnique({ where: { id } }),
      ]);

      if (!reward || !reward.isActive) {
        throw new Error("Reward tidak tersedia.");
      }

      const balanceBefore = account?.creditBalance || 0;
      if (balanceBefore < reward.creditPrice) {
        throw new Error("Credit belum cukup untuk redeem reward ini.");
      }

      if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
        throw new Error("Stock reward sedang habis.");
      }

      const balanceAfter = balanceBefore - reward.creditPrice;
      if (balanceAfter < 0) {
        throw new Error("Credit tidak boleh menjadi negatif.");
      }

      await tx.user.update({
        where: { id: user.id },
        data: { creditBalance: balanceAfter },
      });

      if (reward.stock !== null && reward.stock !== undefined) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { stock: { decrement: 1 } },
        });
      }

      const transaction = await tx.rewardTransaction.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          creditCost: reward.creditPrice,
          status: "REQUESTED",
        },
        include: { reward: true },
      });

      await tx.creditLedger.create({
        data: {
          userId: user.id,
          type: "SPENT",
          source: "STORE_REDEEM",
          amount: reward.creditPrice,
          balanceBefore,
          balanceAfter,
          referenceId: transaction.id,
          note: `Redeem reward: ${reward.name}`,
        },
      });

      return transaction;
    });

    return NextResponse.json({ transaction: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal redeem reward.";
    const status = message.includes("Credit") || message.includes("tersedia") || message.includes("Stock") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
