import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAllowed } from "@/lib/access-control";

const sessionSchema = z.object({
  trainingBatchId: z.string().trim().min(1, "Batch training wajib dipilih."),
  title: z.string().trim().min(2, "Judul sesi wajib diisi."),
  description: z.string().trim().optional().nullable(),
  startAt: z.string().trim().min(1, "Waktu mulai wajib diisi."),
  endAt: z.string().trim().min(1, "Waktu selesai wajib diisi."),
  location: z.string().trim().optional().nullable(),
  trainerId: z.string().trim().optional().nullable(),
  materialUrl: z.string().trim().optional().nullable(),
  orderNumber: z.coerce.number().int().min(0).optional(),
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

export async function GET(request: Request) {
  try {
    const access = await requireActiveTrainingUser();
    if (access.error) return access.error;

    const trainingBatchId = new URL(request.url).searchParams.get("trainingBatchId");
    const sessions = await prisma.trainingSession.findMany({
      where: trainingBatchId ? { trainingBatchId } : undefined,
      orderBy: [{ startAt: "asc" }, { orderNumber: "asc" }],
      include: {
        batch: { select: { id: true, title: true, program: { select: { id: true, title: true } } } },
        trainer: { select: { id: true, fullName: true, chineseName: true, status: true } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil sesi training.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireActiveTrainingUser();
    if (access.error) return access.error;

    const roles = access.user.systemRoles.map((role) => role.role);
    if (!isAllowed(roles, "manageTraining")) {
      return NextResponse.json({ error: "Tidak punya akses membuat sesi training." }, { status: 403 });
    }

    const parsed = sessionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data sesi tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const startAt = parseDate(data.startAt, "Waktu mulai");
    const endAt = parseDate(data.endAt, "Waktu selesai");
    if (startAt.getTime() >= endAt.getTime()) {
      return NextResponse.json({ error: "Waktu mulai harus sebelum waktu selesai." }, { status: 400 });
    }

    const batch = await prisma.trainingBatch.findUnique({ where: { id: data.trainingBatchId }, select: { id: true } });
    if (!batch) return NextResponse.json({ error: "Batch training tidak ditemukan." }, { status: 404 });

    if (data.trainerId) {
      const trainer = await prisma.user.findUnique({ where: { id: data.trainerId }, select: { id: true, status: true } });
      if (!trainer || trainer.status !== "ACTIVE") {
        return NextResponse.json({ error: "Trainer tidak ditemukan atau belum aktif." }, { status: 404 });
      }
    }

    const session = await prisma.trainingSession.create({
      data: {
        trainingBatchId: data.trainingBatchId,
        title: data.title,
        description: data.description || null,
        startAt,
        endAt,
        location: data.location || null,
        trainerId: data.trainerId || null,
        materialUrl: data.materialUrl || null,
        orderNumber: data.orderNumber ?? 0,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat sesi training.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
