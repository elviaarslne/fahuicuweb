import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { prismaLanguage } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  language: z.enum(["id", "zh-TW"]),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Bahasa tidak valid." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      languagePreference: prismaLanguage(parsed.data.language),
      journalVisibility: "PRIVATE_ONLY",
    },
  });

  return NextResponse.json({ ok: true });
}
