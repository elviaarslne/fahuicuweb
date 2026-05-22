import { NextResponse } from "next/server";
import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  title: z.string().min(2).optional(),
  source: z.string().nullable().optional(),
  uploadDate: z.string().optional(),
  content: z.string().min(2).optional(),
  reflectionQuestion: z.string().nullable().optional(),
  creditReward: z.coerce.number().int().min(0).optional(),
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
    if (!parsed.success) return NextResponse.json({ error: "Data wejangan tidak valid." }, { status: 400 });
    const { id } = await params;
    const item = await prisma.dailyWejangan.update({
      where: { id },
      data: {
        ...parsed.data,
        uploadDate: parsed.data.uploadDate ? new Date(parsed.data.uploadDate) : undefined,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update wejangan." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAccess();
    if (access.error) return access.error;
    const { id } = await params;
    await prisma.dailyWejangan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal hapus wejangan." }, { status: 500 });
  }
}
