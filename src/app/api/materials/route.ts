import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEventResource, canViewEventResource } from "@/lib/scope-permissions";

const materialSchema = z.object({
  title: z.string().min(2),
  description: z.string().nullable().optional(),
  type: z.enum(["PDF", "PPT", "MP3", "MP4", "VIDEO_LINK", "NOTES", "OTHER"]),
  fileUrl: z.string().min(1),
  eventId: z.string().nullable().optional(),
  classLevelId: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    }

    const [materials, events] = await Promise.all([
      prisma.material.findMany({
        include: {
          classLevel: true,
          event: {
            include: {
              hostingBranch: true,
              participants: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.event.findMany({
        include: { participants: true, sessions: true },
      }),
    ]);

    const manageableEventIds = events
      .filter((event) => canManageEventResource(user, event))
      .map((event) => event.id);

    return NextResponse.json({
      materials: materials.filter((material) => {
        if (!material.event) return false;
        return canViewEventResource(user, material.event);
      }),
      manageableEventIds: [...new Set(manageableEventIds)],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil materi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    }

    const parsed = materialSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data materi tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    if (!data.eventId && !data.classLevelId) {
      return NextResponse.json({ error: "Materi harus terhubung ke event dan/atau kelas." }, { status: 400 });
    }

    const event = data.eventId
      ? await prisma.event.findUnique({
          where: { id: data.eventId },
          include: { participants: true, sessions: true },
        })
      : null;

    if (data.eventId && !event) {
      return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
    }

    if (event && !canManageEventResource(user, event)) {
      return NextResponse.json({ error: "Tidak punya akses upload materi untuk event ini." }, { status: 403 });
    }

    const material = await prisma.material.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        fileUrl: data.fileUrl,
        eventId: data.eventId || null,
        classLevelId: data.classLevelId || null,
      },
      include: { event: true, classLevel: true },
    });

    return NextResponse.json({ material });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan materi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
