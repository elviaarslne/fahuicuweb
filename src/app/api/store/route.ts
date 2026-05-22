import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const [rewards, transactions, account] = await Promise.all([
      prisma.reward.findMany({
        where: { isActive: true },
        orderBy: { creditPrice: "asc" },
      }),
      prisma.rewardTransaction.findMany({
        where: { userId: user.id },
        include: { reward: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({ where: { id: user.id }, select: { creditBalance: true } }),
    ]);

    return NextResponse.json({ rewards, transactions, creditBalance: account?.creditBalance || 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil store.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
