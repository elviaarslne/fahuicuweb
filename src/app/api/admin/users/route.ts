import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAllowed } from "@/lib/access-control";
import { userScopedWhere } from "@/lib/branch-scope";
import { getCurrentUser } from "@/lib/session";

type UserDivisionInput = { divisionId: string; subdivisionId: string | null };

const updateSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["PENDING", "ACTIVE", "REJECTED", "INACTIVE"]).optional(),
  memberStatus: z.enum(["QIU_DAO_BARU", "ANGGOTA_LAMA"]).optional(),
  divisionIds: z.array(z.string()).optional(),
  subdivisionIds: z.array(z.string()).optional(),
  memberCategory: z.enum(["BAN_SHI_JEN_YUAN", "JIANG_YUAN", "TAN_ZHU", "JIANG_SHI"]).nullable().optional(),
  currentClassId: z.string().nullable().optional(),
  homeBranchId: z.string().optional(),
});

async function buildUserDivisionRows(divisionIds: string[] = [], subdivisionIds: string[] = []) {
  const selectedDivisions = divisionIds.length
    ? await prisma.division.findMany({
        where: { id: { in: divisionIds } },
        include: { subdivisions: true },
      })
    : [];

  if (selectedDivisions.length !== divisionIds.length) {
    throw new Error("Pilihan divisi tidak valid.");
  }

  const selectedSubdivisionIds = new Set(subdivisionIds);
  return selectedDivisions.flatMap<UserDivisionInput>((division) => {
    const subdivisionRows = division.subdivisions
      .filter((subdivision) => selectedSubdivisionIds.has(subdivision.id))
      .map((subdivision) => ({ divisionId: division.id, subdivisionId: subdivision.id }));

    return subdivisionRows.length ? subdivisionRows : [{ divisionId: division.id, subdivisionId: null }];
  });
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const roles = currentUser?.systemRoles.map((role) => role.role) ?? [];
    if (!currentUser || isAllowed(roles, "viewAllMembers") === false) {
      return NextResponse.json({ error: "Tidak punya akses melihat database anggota." }, { status: 403 });
    }

    const [users, classLevels, branches, divisions] = await Promise.all([
      prisma.user.findMany({
        where: userScopedWhere(currentUser),
        orderBy: { createdAt: "desc" },
        include: {
          homeBranch: true,
          currentClass: true,
          systemRoles: true,
          userDivisions: {
            include: { division: true, subdivision: true },
          },
        },
      }),
      prisma.classLevel.findMany({ orderBy: { levelNumber: "asc" } }),
      prisma.branch.findMany({ orderBy: [{ isCenter: "desc" }, { name: "asc" }] }),
      prisma.division.findMany({
        orderBy: { sortOrder: "asc" },
        include: { subdivisions: { orderBy: { sortOrder: "asc" } } },
      }),
    ]);

    return NextResponse.json({ users, classLevels, branches, divisions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const roles = currentUser?.systemRoles.map((role) => role.role) ?? [];
    if (!currentUser || isAllowed(roles, "approveUser") === false) {
      return NextResponse.json({ error: "Hanya admin yang dapat approve/evaluasi user." }, { status: 403 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data update tidak valid." }, { status: 400 });
    }

    const { userId, ...data } = parsed.data;
    if (!roles.includes("SUPER_ADMIN") && data.homeBranchId && data.homeBranchId !== currentUser.homeBranchId) {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat memindahkan user antar cabang." }, { status: 403 });
    }

    const divisionRows = data.divisionIds ? await buildUserDivisionRows(data.divisionIds, data.subdivisionIds || []) : null;
    const user = await prisma.$transaction(async (tx) => {
      if (divisionRows) {
        await tx.userDivision.deleteMany({ where: { userId } });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          homeBranch: data.homeBranchId ? { connect: { id: data.homeBranchId } } : undefined,
          status: data.status,
          memberStatus: data.memberStatus,
          memberCategory: data.memberCategory,
          currentClass: data.currentClassId === null
            ? { disconnect: true }
            : data.currentClassId
              ? { connect: { id: data.currentClassId } }
              : undefined,
          userDivisions: divisionRows?.length ? { create: divisionRows } : undefined,
        },
        include: {
          homeBranch: true,
          currentClass: true,
          systemRoles: true,
          userDivisions: {
            include: { division: true, subdivision: true },
          },
        },
      });
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
