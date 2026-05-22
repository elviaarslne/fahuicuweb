import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const divisions = await prisma.division.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        subdivisions: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({ divisions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data divisi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
