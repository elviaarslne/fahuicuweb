import { NextResponse } from "next/server";
import { z } from "zod";
import { getRoleNames } from "@/lib/branch-scope";
import { canAdvanceEventStatus, eventStatusOptions, getEventStatusLabel } from "@/lib/event-options";
import { canDeleteEvent, canOperateEventByBranchOrAssignment } from "@/lib/operational-permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const statusValues = eventStatusOptions.map((item) => item.value) as [string, ...string[]];

const updateEventSchema = z.object({
  title: z.string().min(2).optional(),
  hostingBranchId: z.string().min(1).optional(),
  category: z.string().min(2).optional(),
  purpose: z.string().min(2).optional(),
  expectedOutcome: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startAt: z.string().optional(),
  endAt: z.string().nullable().optional(),
  targetClassId: z.string().nullable().optional(),
  minimumParticipants: z.coerce.number().int().min(0).optional(),
  minimumAge: z.coerce.number().int().min(0).nullable().optional(),
  maximumAge: z.coerce.number().int().min(0).nullable().optional(),
  isConfirmed: z.boolean().optional(),
  status: z.enum(statusValues).optional(),
});

async function getEditAccess() {
  const user = await getCurrentUser();
  const roles = getRoleNames(user);
  return { user, roles };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getEditAccess();
    if (!access.user) {
      return NextResponse.json({ error: "Tidak punya akses mengubah event." }, { status: 403 });
    }

    const { id } = await params;
    const parsed = updateEventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data event tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const existing = await prisma.event.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    }

    if (!canOperateEventByBranchOrAssignment(access.user, existing, ["PENGAWAS", "COORDINATOR"])) {
      return NextResponse.json({ error: "Hanya pengurus cabang, Pengawas, atau Koordinator event yang dapat mengubah event." }, { status: 403 });
    }

    if (data.hostingBranchId && !access.roles.includes("SUPER_ADMIN") && data.hostingBranchId !== existing.hostingBranchId) {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat memindahkan event antar cabang." }, { status: 403 });
    }

    if (data.status) {
      if (existing.status !== data.status && !canAdvanceEventStatus(existing.status, data.status)) {
        return NextResponse.json(
          {
            error: `Lifecycle harus berurutan. Dari ${getEventStatusLabel(existing.status)} hanya bisa lanjut ke tahap berikutnya.`,
          },
          { status: 400 },
        );
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        hostingBranchId: data.hostingBranchId,
        category: data.category,
        purpose: data.purpose,
        expectedOutcome: data.expectedOutcome,
        description: data.description,
        location: data.location,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt === undefined ? undefined : data.endAt ? new Date(data.endAt) : null,
        targetClassId: data.targetClassId,
        minimumParticipants: data.minimumParticipants,
        minimumAge: data.minimumAge,
        maximumAge: data.maximumAge,
        isConfirmed: data.isConfirmed,
        status: data.status as any,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getEditAccess();
    if (!access.user) {
      return NextResponse.json({ error: "Tidak punya akses menghapus event." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.event.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    }

    if (!canDeleteEvent(access.user, existing)) {
      return NextResponse.json({ error: "Hanya pengurus cabang (Ketua/Admin) atau Super Admin yang dapat menghapus event." }, { status: 403 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
