import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canModerateActivity, requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    if (!canModerateActivity(user)) return NextResponse.json({ error: "Tidak punya akses moderasi." }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    if (typeof body.isHiddenByAdmin !== "boolean") return NextResponse.json({ error: "Data komentar tidak valid." }, { status: 400 });
    const comment = await prisma.activityComment.update({ where: { id }, data: { isHiddenByAdmin: body.isHiddenByAdmin } });
    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update komentar." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    const { id } = await params;
    const comment = await prisma.activityComment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });
    if (comment.userId !== user!.id && !canModerateActivity(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    await prisma.activityComment.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menghapus komentar." }, { status: 500 });
  }
}
