import { NextResponse } from "next/server";
import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  creditPrice: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

async function requireAccess() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 }) };
  if (!isContentManager(user)) return { error: NextResponse.json({ error: "Tidak punya akses." }, { status: 403 }) };
  return { user };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (access.error) return access.error;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data reward tidak valid." }, { status: 400 });
    const { id } = await params;
    const item = await prisma.reward.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update reward." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (access.error) return access.error;
    const { id } = await params;
    await prisma.reward.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal nonaktifkan reward." }, { status: 500 });
  }
}
