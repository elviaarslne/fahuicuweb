import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEventResource, canViewEventResource } from "@/lib/scope-permissions";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  speakerId: z.string().nullable().optional(),
  trainerId: z.string().nullable().optional(),
  orderNumber: z.coerce.number().int().min(0).default(0),
  materialUrl: z.string().nullable().optional(),
});

async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: { participants: true },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  if (!canViewEventResource(user, event)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  const sessions = await prisma.eventSession.findMany({ where: { eventId: id }, orderBy: [{ orderNumber: "asc" }, { startAt: "asc" }] });
  return NextResponse.json({ sessions });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    const { id } = await params;
    const event = await getEvent(id);
    if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    if (!canManageEventResource(user, event)) return NextResponse.json({ error: "Tidak punya akses mengelola sesi event." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data sesi tidak valid." }, { status: 400 });
    const session = await prisma.eventSession.create({
      data: {
        eventId: id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
        speakerId: parsed.data.speakerId || null,
        trainerId: parsed.data.trainerId || null,
        orderNumber: parsed.data.orderNumber,
        materialUrl: parsed.data.materialUrl || null,
      },
    });
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan sesi." }, { status: 500 });
  }
}
