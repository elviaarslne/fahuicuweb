import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { isAllowed } from "@/lib/access-control";
import { branchScopedWhere, getRoleNames } from "@/lib/branch-scope";
import { eventStatusOptions } from "@/lib/event-options";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const statusValues = eventStatusOptions.map((item) => item.value) as [string, ...string[]];

const eventSchema = z.object({
  hostingBranchId: z.string().min(1),
  title: z.string().min(2),
  category: z.string().min(2),
  purpose: z.string().min(2),
  expectedOutcome: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  targetClassId: z.string().nullable().optional(),
  minimumParticipants: z.coerce.number().int().min(0).optional(),
  minimumAge: z.coerce.number().int().min(0).nullable().optional(),
  maximumAge: z.coerce.number().int().min(0).nullable().optional(),
  isConfirmed: z.boolean().optional(),
  status: z.enum(statusValues).optional(),
});

async function getViewer() {
  const user = await getCurrentUser();
  return { user, roles: getRoleNames(user) };
}

export async function GET() {
  try {
    const { user, roles } = await getViewer();
    if (isAllowed(roles, "viewEvents") === false) {
      return NextResponse.json({ error: "Tidak punya akses melihat event." }, { status: 403 });
    }

    const [events, users, classLevels, branches] = await Promise.all([
      prisma.event.findMany({
        where: branchScopedWhere(user),
        orderBy: { startAt: "asc" },
        include: {
          hostingBranch: true,
          targetClass: true,
          participants: {
            orderBy: { createdAt: "asc" },
            include: { user: true },
          },
          _count: { select: { participants: true, feedbacks: true, materials: true } },
        },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", ...("hostingBranchId" in branchScopedWhere(user) ? { homeBranchId: user?.homeBranchId } : {}) },
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          chineseName: true,
          memberCategory: true,
          birthDate: true,
          isCoordinatorEligible: true,
          homeBranchId: true,
        },
      }),
      prisma.classLevel.findMany({ orderBy: { levelNumber: "asc" } }),
      prisma.branch.findMany({ orderBy: [{ isCenter: "desc" }, { name: "asc" }] }),
    ]);

    return NextResponse.json({ events, users, classLevels, branches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, roles } = await getViewer();
    if (!isAllowed(roles, "createEvent")) {
      return NextResponse.json({ error: "Tidak punya akses membuat event." }, { status: 403 });
    }

    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data event tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    if (!roles.includes("SUPER_ADMIN") && user?.homeBranchId !== data.hostingBranchId) {
      return NextResponse.json({ error: "Event hanya bisa dibuat untuk cabang sendiri." }, { status: 403 });
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          hostingBranchId: data.hostingBranchId,
          title: data.title,
          category: data.category,
          purpose: data.purpose,
          expectedOutcome: data.expectedOutcome,
          description: data.description || null,
          location: data.location || null,
          startAt: new Date(data.startAt),
          endAt: data.endAt ? new Date(data.endAt) : null,
          targetClassId: data.targetClassId || null,
          minimumParticipants: data.minimumParticipants || 0,
          minimumAge: data.minimumAge ?? null,
          maximumAge: data.maximumAge ?? null,
          isConfirmed: data.isConfirmed || false,
          status: (data.status || "DRAFT") as any,
          qrToken: `evt_${nanoid(18)}`,
        },
      });

      if (user) {
        await tx.eventParticipant.create({
          data: {
            eventId: created.id,
            userId: user.id,
            role: "COORDINATOR",
            registrationStatus: "APPROVED",
            approvedByUserId: user.id,
            approvedAt: new Date(),
          },
        });
      }

      return created;
    });

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
