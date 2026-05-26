import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { momentReactionEmojis, momentReactionInputSchema, requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

function summarize(reactions: Array<{ emoji: string; userId: string }>, userId: string) {
  return {
    reactionCounts: momentReactionEmojis.map((emoji) => ({
      emoji,
      count: reactions.filter((reaction) => reaction.emoji === emoji).length,
    })).filter((item) => item.count > 0),
    reactionTotal: reactions.length,
    myReaction: reactions.find((reaction) => reaction.userId === userId)?.emoji || null,
  };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const { id } = await context.params;
    const parsed = momentReactionInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Reaksi tidak valid." }, { status: 400 });
    }

    const post = await prisma.activityPost.findFirst({
      where: {
        id,
        visibility: "INTERNAL",
        deletedAt: null,
        isHiddenByAdmin: false,
        user: { status: "ACTIVE" },
      },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Moment tidak ditemukan." }, { status: 404 });
    }

    await prisma.activityReaction.upsert({
      where: { postId_userId: { postId: post.id, userId: user!.id } },
      update: { emoji: parsed.data.emoji },
      create: { postId: post.id, userId: user!.id, emoji: parsed.data.emoji },
    });

    const reactions = await prisma.activityReaction.findMany({
      where: { postId: post.id },
      select: { emoji: true, userId: true },
    });

    return NextResponse.json(summarize(reactions, user!.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengirim reaksi." }, { status: 500 });
  }
}
