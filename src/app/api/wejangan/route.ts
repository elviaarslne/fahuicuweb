import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const wejangan = await prisma.dailyWejangan.findMany({
      include: {
        reflections: { where: { userId: user.id } },
      },
      orderBy: { uploadDate: "desc" },
      take: 30,
    });

    return NextResponse.json({ wejangan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil wejangan harian.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
