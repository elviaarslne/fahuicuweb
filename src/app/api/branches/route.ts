import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: [{ isCenter: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ branches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data cabang.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
