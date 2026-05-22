import { NextResponse } from "next/server";
import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  creditPrice: z.coerce.number().int().min(0),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
  if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  const items = await prisma.reward.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data reward tidak valid." }, { status: 400 });
    const item = await prisma.reward.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        creditPrice: parsed.data.creditPrice,
        stock: parsed.data.stock ?? null,
        isActive: parsed.data.isActive,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan reward." }, { status: 500 });
  }
}
