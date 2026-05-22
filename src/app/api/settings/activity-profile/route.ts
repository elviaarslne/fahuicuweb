import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeUsername, validateUsername } from "@/lib/activity";

const schema = z.object({
  username: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data profil activity tidak valid." }, { status: 400 });

    const username = normalizeUsername(parsed.data.username);
    const usernameError = validateUsername(username);
    if (usernameError) return NextResponse.json({ error: usernameError }, { status: 400 });

    if (username) {
      const taken = await prisma.user.findFirst({ where: { username, NOT: { id: user.id } }, select: { id: true } });
      if (taken) return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        bio: parsed.data.bio?.trim() || null,
        activityProfileUpdatedAt: new Date(),
      },
      select: { id: true, username: true, bio: true, activityProfileUpdatedAt: true },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal update profil activity." }, { status: 500 });
  }
}
