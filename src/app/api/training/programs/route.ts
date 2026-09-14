import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAllowed } from "@/lib/access-control";

const programStatuses = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;

const programSchema = z.object({
  title: z.string().trim().min(2, "Judul program wajib diisi."),
  description: z.string().trim().optional().nullable(),
  purpose: z.string().trim().optional().nullable(),
  expectedOutcome: z.string().trim().optional().nullable(),
  status: z.enum(programStatuses).optional(),
});

async function requireActiveTrainingUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 }) };
  if (user.status !== "ACTIVE") return { error: NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  try {
    const access = await requireActiveTrainingUser();
    if (access.error) return access.error;

    const programs = await prisma.trainingProgram.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, fullName: true, chineseName: true } },
        _count: { select: { batches: true } },
      },
    });

    return NextResponse.json({ programs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil program training.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireActiveTrainingUser();
    if (access.error) return access.error;

    const roles = access.user.systemRoles.map((role) => role.role);
    if (!isAllowed(roles, "manageTraining")) {
      return NextResponse.json({ error: "Tidak punya akses membuat program training." }, { status: 403 });
    }

    const parsed = programSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data program tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const program = await prisma.trainingProgram.create({
      data: {
        title: data.title,
        description: data.description || null,
        purpose: data.purpose || null,
        expectedOutcome: data.expectedOutcome || null,
        status: data.status || "DRAFT",
        createdByUserId: access.user.id,
      },
    });

    return NextResponse.json({ program });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat program training.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
