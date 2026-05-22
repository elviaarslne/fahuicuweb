import { NextResponse } from "next/server";
import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  isHiddenByAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    if (!isContentManager(user)) return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data activity tidak valid." }, { status: 400 });
    const { id } = await params;
    const isHiddenByAdmin = typeof parsed.data.isHiddenByAdmin === "boolean" ? parsed.data.isHiddenByAdmin : parsed.data.isActive === false;
    const post = await prisma.activityPost.update({ where: { id }, data: { isHiddenByAdmin } });
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update activity." }, { status: 500 });
  }
}
