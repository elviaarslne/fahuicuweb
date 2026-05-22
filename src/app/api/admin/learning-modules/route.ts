import { NextResponse } from "next/server";
import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().nullable().optional(),
  classLevelId: z.string().nullable().optional(),
  orderNumber: z.coerce.number().int().min(0).default(0),
  materialUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
  if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  const items = await prisma.learningModule.findMany({ include: { classLevel: true }, orderBy: [{ orderNumber: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data modul tidak valid." }, { status: 400 });
    const item = await prisma.learningModule.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        classLevelId: parsed.data.classLevelId || null,
        orderNumber: parsed.data.orderNumber,
        materialUrl: parsed.data.materialUrl || null,
        isActive: parsed.data.isActive,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan modul." }, { status: 500 });
  }
}
