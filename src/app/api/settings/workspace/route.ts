import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { availableWorkspaces } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  workspace: z.enum(["MEMBER", "SPEAKER", "TRAINER", "ADMIN"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Workspace tidak valid." }, { status: 400 });

  const roles = user.systemRoles.map((role) => role.role);
  if (!availableWorkspaces(roles).includes(parsed.data.workspace)) {
    return NextResponse.json({ error: "Workspace tidak tersedia untuk user ini." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { selectedWorkspace: parsed.data.workspace },
  });

  const response = NextResponse.json({ ok: true, workspace: parsed.data.workspace });
  response.cookies.set("fhc_workspace", parsed.data.workspace, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
