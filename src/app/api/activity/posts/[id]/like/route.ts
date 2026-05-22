import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    const { id } = await params;
    const post = await prisma.activityPost.findFirst({ where: { id, deletedAt: null, isHiddenByAdmin: false, user: { status: "ACTIVE" } } });
    if (!post) return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });

    const existing = await prisma.activityLike.findUnique({ where: { postId_userId: { postId: id, userId: user!.id } } });
    if (existing) {
      await prisma.activityLike.delete({ where: { id: existing.id } });
      const likeCount = await prisma.activityLike.count({ where: { postId: id } });
      return NextResponse.json({ liked: false, likeCount });
    }
    await prisma.activityLike.create({ data: { postId: id, userId: user!.id } });
    const likeCount = await prisma.activityLike.count({ where: { postId: id } });
    return NextResponse.json({ liked: true, likeCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update like." }, { status: 500 });
  }
}
