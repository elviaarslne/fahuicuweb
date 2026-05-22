import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activityPostInputSchema, requireActiveActivityUser, serializeActivityPost } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";

function postInclude() {
  return {
    user: {
      select: {
        id: true,
        fullName: true,
        chineseName: true,
        email: true,
        username: true,
        bio: true,
        profilePhotoUrl: true,
        memberCategory: true,
        homeBranch: true,
        currentClass: true,
        userDivisions: { include: { division: true, subdivision: true } },
      },
    },
    media: { orderBy: { orderNumber: "asc" as const } },
    likes: { select: { userId: true } },
    comments: {
      where: { deletedAt: null },
      include: { user: { select: { id: true, fullName: true, chineseName: true, username: true, profilePhotoUrl: true } } },
      orderBy: { createdAt: "desc" as const },
      take: 20,
    },
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const posts = await prisma.activityPost.findMany({
      where: {
        visibility: "INTERNAL",
        deletedAt: null,
        isHiddenByAdmin: false,
        user: { status: "ACTIVE" },
      },
      include: postInclude(),
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    return NextResponse.json({ posts: posts.map((post) => serializeActivityPost(post, user?.id)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengambil activity feed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const parsed = activityPostInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data posting tidak valid." }, { status: 400 });
    }

    const post = await prisma.activityPost.create({
      data: {
        userId: user!.id,
        caption: parsed.data.caption?.trim() || null,
        type: parsed.data.type,
        visibility: "INTERNAL",
        media: {
          create: parsed.data.media.map((media, index) => ({
            mediaUrl: media.mediaUrl,
            mediaType: media.mediaType,
            orderNumber: media.orderNumber ?? index,
            altText: media.altText || null,
          })),
        },
      },
      include: postInclude(),
    });

    return NextResponse.json({ post: serializeActivityPost(post, user?.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal membuat activity post." }, { status: 500 });
  }
}
