import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAllowed } from "@/lib/access-control";

const batchStatuses = ["DRAFT", "ENROLLMENT_OPEN", "ENROLLMENT_CLOSED", "ONGOING", "COMPLETED", "ARCHIVED"] as const;

const batchSchema = z.object({
  trainingProgramId: z.string().trim().min(1, "Program training wajib dipilih."),
  title: z.string().trim().min(2, "Judul batch wajib diisi."),
  batchCode: z.string().trim().optional().nullable(),
  startDate: z.string().trim().min(1, "Tanggal mulai wajib diisi."),
  endDate: z.string().trim().min(1, "Tanggal selesai wajib diisi."),
  registrationOpenAt: z.string().trim().optional().nullable(),
  registrationCloseAt: z.string().trim().optional().nullable(),
  hostingBranchId: z.string().trim().optional().nullable(),
  capacity: z.coerce.number().int().positive("Kapasitas harus lebih dari 0.").optional().nullable(),
  status: z.enum(batchStatuses).optional(),
});

async function requireActiveTrainingUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 }) };
  if (user.status !== "ACTIVE") return { error: NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 403 }) };
  return { user };
}

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} tidak valid.`);
  return date;
}

export async function GET() {
  try {
    const access = await requireActiveTrainingUser();
    if (access.error) return access.error;

    const batches = await prisma.trainingBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        program: { select: { id: true, title: true } },
        hostingBranch: { select: { id: true, name: true } },
        _count: { select: { sessions: true, enrollments: true } },
      },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil batch training.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireActiveTrainingUser();
    if (access.error) return access.error;

    const roles = access.user.systemRoles.map((role) => role.role);
    if (!isAllowed(roles, "manageTraining")) {
      return NextResponse.json({ error: "Tidak punya akses membuat batch training." }, { status: 403 });
    }

    const parsed = batchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data batch tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const startDate = parseDate(data.startDate, "Tanggal mulai");
    const endDate = parseDate(data.endDate, "Tanggal selesai");
    if (startDate.getTime() > endDate.getTime()) {
      return NextResponse.json({ error: "Tanggal mulai harus sebelum atau sama dengan tanggal selesai." }, { status: 400 });
    }

    const program = await prisma.trainingProgram.findUnique({ where: { id: data.trainingProgramId }, select: { id: true } });
    if (!program) return NextResponse.json({ error: "Program training tidak ditemukan." }, { status: 404 });

    if (data.hostingBranchId) {
      const branch = await prisma.branch.findUnique({ where: { id: data.hostingBranchId }, select: { id: true } });
      if (!branch) return NextResponse.json({ error: "Cabang tidak ditemukan." }, { status: 404 });
    }

    const batch = await prisma.trainingBatch.create({
      data: {
        trainingProgramId: data.trainingProgramId,
        hostingBranchId: data.hostingBranchId || null,
        title: data.title,
        batchCode: data.batchCode || null,
        startDate,
        endDate,
        registrationOpenAt: data.registrationOpenAt ? parseDate(data.registrationOpenAt, "Tanggal buka pendaftaran") : null,
        registrationCloseAt: data.registrationCloseAt ? parseDate(data.registrationCloseAt, "Tanggal tutup pendaftaran") : null,
        capacity: data.capacity ?? null,
        status: data.status || "DRAFT",
      },
    });

    return NextResponse.json({ batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat batch training.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
