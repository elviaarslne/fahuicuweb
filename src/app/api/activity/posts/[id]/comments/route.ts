import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({ content: z.string().trim().min(1).max(1000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    const { id } = await params;
    const post = await prisma.activityPost.findFirst({ where: { id, deletedAt: null, isHiddenByAdmin: false, user: { status: "ACTIVE" } } });
    if (!post) return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Komentar tidak boleh kosong." }, { status: 400 });
    const comment = await prisma.activityComment.create({
      data: { postId: id, userId: user!.id, content: parsed.data.content },
      include: { user: { select: { id: true, fullName: true, chineseName: true, username: true, profilePhotoUrl: true } } },
    });
    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membuat komentar." }, { status: 500 });
  }
}
