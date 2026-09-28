import { NextResponse } from "next/server";
import { LEGACY_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  // Also clear the legacy cookie name in case a browser still has it.
  response.cookies.set(LEGACY_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
