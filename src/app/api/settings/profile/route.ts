import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { saveRegistrationFile } from "@/lib/upload";

const profileSchema = z.object({
  fullName: z.string().min(2),
  chineseName: z.string().optional(),
  phone: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan login dahulu." }, { status: 401 });

    const formData = await request.formData();
    const parsed = profileSchema.safeParse({
      fullName: formData.get("fullName"),
      chineseName: formData.get("chineseName") || "",
      phone: formData.get("phone") || "",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data profil tidak valid." }, { status: 400 });
    }

    const profilePhoto = formData.get("profilePhoto");
    const qiuDaoCard = formData.get("qiuDaoCard");
    const profilePhotoUrl = profilePhoto instanceof File && profilePhoto.size > 0 ? await saveRegistrationFile(profilePhoto, "profile") : undefined;
    const qiuDaoCardUrl = qiuDaoCard instanceof File && qiuDaoCard.size > 0 ? await saveRegistrationFile(qiuDaoCard, "qiu-dao") : undefined;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: parsed.data.fullName,
        chineseName: parsed.data.chineseName || null,
        phone: parsed.data.phone || null,
        profilePhotoUrl,
        qiuDaoCardUrl,
      },
      select: { id: true, fullName: true, chineseName: true, phone: true, profilePhotoUrl: true, qiuDaoCardUrl: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update profil.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
