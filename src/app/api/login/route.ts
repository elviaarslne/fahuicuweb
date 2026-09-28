import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionToken, LEGACY_COOKIE_NAME, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Email atau password tidak valid." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { systemRoles: true },
    });

    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }

    if (user.status === "PENDING") {
      return NextResponse.json({ error: "Akun masih menunggu evaluasi." }, { status: 403 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun belum aktif." }, { status: 403 });
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roles: user.systemRoles.map((role) => role.role),
      },
    });

    // Each login mints a brand-new signed token (fresh iat/exp) rather than
    // reusing any prior client-side state, so there's nothing to fixate.
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    // Retire the old unsigned cookie for any browser that still has it.
    response.cookies.set(LEGACY_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
