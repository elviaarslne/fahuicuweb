import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const { id } = await context.params;
    const post = await prisma.activityPost.findFirst({
      where: {
        id,
        visibility: "INTERNAL",
        deletedAt: null,
        isHiddenByAdmin: false,
        user: { status: "ACTIVE" },
      },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Moment tidak ditemukan." }, { status: 404 });
    }

    if (post.userId === user!.id) {
      return NextResponse.json({ viewed: false, owner: true });
    }

    const view = await prisma.activityPostView.upsert({
      where: { postId_viewerId: { postId: post.id, viewerId: user!.id } },
      update: {},
      create: { postId: post.id, viewerId: user!.id },
    });

    return NextResponse.json({ viewed: true, viewedAt: view.viewedAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mencatat Moment." }, { status: 500 });
  }
}
