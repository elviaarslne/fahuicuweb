import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEventResource } from "@/lib/scope-permissions";

const updateMaterialSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["PDF", "PPT", "MP3", "MP4", "VIDEO_LINK", "NOTES", "OTHER"]).optional(),
  fileUrl: z.string().min(1).optional(),
  eventId: z.string().nullable().optional(),
  classLevelId: z.string().nullable().optional(),
});

async function requireMaterialManageAccess(id: string) {
  const user = await getCurrentUser();
  if (!user) return { user, material: null, allowed: false };

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      event: { include: { participants: true } },
    },
  });
  if (!material) return { user, material, allowed: false };
  if (!material.event) return { user, material, allowed: false };

  return { user, material, allowed: canManageEventResource(user, material.event) };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireMaterialManageAccess(id);
    if (!access.material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }
    if (!access.allowed) {
      return NextResponse.json({ error: "Tidak punya akses mengubah materi ini." }, { status: 403 });
    }

    const parsed = updateMaterialSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data materi tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const nextEventId = data.eventId === undefined ? access.material.eventId : data.eventId;
    if (nextEventId && nextEventId !== access.material.eventId) {
      const nextEvent = await prisma.event.findUnique({
        where: { id: nextEventId },
        include: { participants: true },
      });
      if (!nextEvent || !canManageEventResource(access.user, nextEvent)) {
        return NextResponse.json({ error: "Tidak punya akses memindahkan materi ke event ini." }, { status: 403 });
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        fileUrl: data.fileUrl,
        eventId: data.eventId,
        classLevelId: data.classLevelId,
      },
      include: { event: true, classLevel: true },
    });

    return NextResponse.json({ material });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update materi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireMaterialManageAccess(id);
    if (!access.material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }
    if (!access.allowed) {
      return NextResponse.json({ error: "Tidak punya akses menghapus materi ini." }, { status: 403 });
    }

    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal hapus materi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
