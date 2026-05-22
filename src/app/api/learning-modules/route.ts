import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const modules = await prisma.learningModule.findMany({
      where: {
        isActive: true,
        OR: [{ classLevelId: null }, { classLevelId: user.currentClassId }],
      },
      include: {
        classLevel: true,
        progress: { where: { userId: user.id } },
      },
      orderBy: [{ orderNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ modules });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil modul pembelajaran.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
