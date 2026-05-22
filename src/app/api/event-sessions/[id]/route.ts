import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEventResource } from "@/lib/scope-permissions";

const schema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  speakerId: z.string().nullable().optional(),
  trainerId: z.string().nullable().optional(),
  orderNumber: z.coerce.number().int().min(0).optional(),
  materialUrl: z.string().nullable().optional(),
});

async function requireAccess(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 }) };
  const session = await prisma.eventSession.findUnique({
    where: { id },
    include: { event: { include: { participants: true } } },
  });
  if (!session) return { error: NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 }) };
  if (!canManageEventResource(user, session.event)) return { error: NextResponse.json({ error: "Tidak punya akses mengelola sesi event." }, { status: 403 }) };
  return { user, session };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireAccess(id);
    if (access.error) return access.error;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data sesi tidak valid." }, { status: 400 });
    const session = await prisma.eventSession.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        startAt: parsed.data.startAt === undefined ? undefined : parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        endAt: parsed.data.endAt === undefined ? undefined : parsed.data.endAt ? new Date(parsed.data.endAt) : null,
        speakerId: parsed.data.speakerId,
        trainerId: parsed.data.trainerId,
        orderNumber: parsed.data.orderNumber,
        materialUrl: parsed.data.materialUrl,
      },
    });
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update sesi." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireAccess(id);
    if (access.error) return access.error;
    await prisma.eventSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal hapus sesi." }, { status: 500 });
  }
}
