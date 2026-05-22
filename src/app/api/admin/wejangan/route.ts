import { NextResponse } from "next/server";
import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  title: z.string().min(2),
  source: z.string().nullable().optional(),
  uploadDate: z.string().optional(),
  content: z.string().min(2),
  reflectionQuestion: z.string().nullable().optional(),
  creditReward: z.coerce.number().int().min(0).default(10),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
  if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });

  const items = await prisma.dailyWejangan.findMany({ orderBy: { uploadDate: "desc" }, take: 100 });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data wejangan tidak valid." }, { status: 400 });

    const item = await prisma.dailyWejangan.create({
      data: {
        title: parsed.data.title,
        source: parsed.data.source || null,
        uploadDate: parsed.data.uploadDate ? new Date(parsed.data.uploadDate) : new Date(),
        content: parsed.data.content,
        reflectionQuestion: parsed.data.reflectionQuestion || null,
        creditReward: parsed.data.creditReward,
        createdByAdminId: user.id,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan wejangan." }, { status: 500 });
  }
}
