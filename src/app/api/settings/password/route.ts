import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmNewPassword: z.string().min(6),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data password tidak valid." }, { status: 400 });
    const data = parsed.data;

    if (data.newPassword !== data.confirmNewPassword) {
      return NextResponse.json({ error: "Konfirmasi password baru tidak sama." }, { status: 400 });
    }

    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!fullUser || !(await bcrypt.compare(data.currentPassword, fullUser.passwordHash))) {
      return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(data.newPassword, 10) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengganti password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
