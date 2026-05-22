import { NextResponse } from "next/server";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { serializeActivityPost } from "@/lib/activity";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
  if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });

  const url = new URL(request.url);
  const query = url.searchParams.get("user")?.trim();
  const branch = url.searchParams.get("branch")?.trim();
  const category = url.searchParams.get("category")?.trim();
  const visibility = url.searchParams.get("visibility")?.trim();

  const posts = await prisma.activityPost.findMany({
    where: {
      ...(category ? { type: category as any } : {}),
      ...(visibility === "hidden" ? { isHiddenByAdmin: true } : {}),
      ...(visibility === "visible" ? { isHiddenByAdmin: false, deletedAt: null } : {}),
      ...(query ? { user: { OR: [{ fullName: { contains: query } }, { chineseName: { contains: query } }, { email: { contains: query } }, { username: { contains: query } }] } } : {}),
      ...(branch ? { user: { homeBranchId: branch } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          chineseName: true,
          email: true,
          username: true,
          profilePhotoUrl: true,
          homeBranch: true,
          currentClass: true,
          memberCategory: true,
        },
      },
      media: { orderBy: { orderNumber: "asc" } },
      likes: { select: { userId: true } },
      comments: {
        where: { deletedAt: null },
        include: { user: { select: { id: true, fullName: true, chineseName: true, username: true, profilePhotoUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return NextResponse.json({ posts: posts.map((post) => serializeActivityPost(post, user.id)), branches });
}
