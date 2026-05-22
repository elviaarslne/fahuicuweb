import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activityPostInputSchema, canModerateActivity, requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

const includePost = {
  media: true,
  likes: { select: { userId: true } },
  comments: true,
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.activityPost.findUnique({ where: { id }, include: { user: true } });
    if (!existing || existing.deletedAt) return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });

    const body = await request.json();
    const moderator = canModerateActivity(user);
    if (typeof body.isHiddenByAdmin === "boolean") {
      if (!moderator) return NextResponse.json({ error: "Tidak punya akses moderasi." }, { status: 403 });
      const post = await prisma.activityPost.update({ where: { id }, data: { isHiddenByAdmin: body.isHiddenByAdmin }, include: includePost });
      return NextResponse.json({ post });
    }

    if (existing.userId !== user!.id) return NextResponse.json({ error: "Hanya pemilik post yang dapat mengedit." }, { status: 403 });
    const parsed = activityPostInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data posting tidak valid." }, { status: 400 });

    const post = await prisma.$transaction(async (tx) => {
      await tx.activityMedia.deleteMany({ where: { postId: id } });
      return tx.activityPost.update({
        where: { id },
        data: {
          caption: parsed.data.caption?.trim() || null,
          type: parsed.data.type,
          legacyImageUrl: null,
          media: {
            create: parsed.data.media.map((media, index) => ({
              mediaUrl: media.mediaUrl,
              mediaType: media.mediaType,
              orderNumber: media.orderNumber ?? index,
              altText: media.altText || null,
            })),
          },
        },
        include: includePost,
      });
    });

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update activity post." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.activityPost.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });
    if (existing.userId !== user!.id && !canModerateActivity(user)) {
      return NextResponse.json({ error: "Tidak punya akses menghapus post." }, { status: 403 });
    }
    await prisma.activityPost.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menghapus post." }, { status: 500 });
  }
}
