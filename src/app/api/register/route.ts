import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveRegistrationFile } from "@/lib/upload";

type UserDivisionInput = { divisionId: string; subdivisionId: string | null };

const registerSchema = z.object({
  homeBranchId: z.string().min(1, "Cabang wajib dipilih."),
  fullName: z.string().min(2, "Nama lengkap wajib diisi."),
  chineseName: z.string().optional(),
  email: z.email("Email tidak valid."),
  phone: z.string().optional(),
  memberStatus: z.enum(["QIU_DAO_BARU", "ANGGOTA_LAMA"]).default("QIU_DAO_BARU"),
  password: z.string().min(6, "Password minimal 6 karakter."),
  confirmPassword: z.string().min(6),
});

function uniqueStrings(values: FormDataEntryValue[]) {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsed = registerSchema.safeParse({
      fullName: formData.get("fullName"),
      homeBranchId: formData.get("homeBranchId"),
      chineseName: formData.get("chineseName") || "",
      email: formData.get("email"),
      phone: formData.get("phone") || "",
      memberStatus: formData.get("memberStatus") || "QIU_DAO_BARU",
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid." }, { status: 400 });
    }

    const data = parsed.data;
    const divisionIds = uniqueStrings(formData.getAll("divisionIds"));
    const subdivisionIds = uniqueStrings(formData.getAll("subdivisionIds"));

    if (data.password !== data.confirmPassword) {
      return NextResponse.json({ error: "Konfirmasi password tidak sama." }, { status: 400 });
    }

    if (data.memberStatus === "ANGGOTA_LAMA" && divisionIds.length === 0) {
      return NextResponse.json({ error: "Anggota lama wajib memilih minimal satu divisi." }, { status: 400 });
    }

    const qiuDaoFile = formData.get("qiuDaoCard");
    if (!(qiuDaoFile instanceof File) || qiuDaoFile.size === 0) {
      return NextResponse.json({ error: "Bukti kartu Qiu Dao wajib diupload." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const profilePhoto = formData.get("profilePhoto");
    const profilePhotoUrl = profilePhoto instanceof File ? await saveRegistrationFile(profilePhoto, "profile") : null;
    const qiuDaoCardUrl = await saveRegistrationFile(qiuDaoFile, "qiu-dao");
    const selectedDivisions = divisionIds.length
      ? await prisma.division.findMany({
          where: { id: { in: divisionIds } },
          include: { subdivisions: true },
        })
      : [];
    if (selectedDivisions.length !== divisionIds.length) {
      return NextResponse.json({ error: "Pilihan divisi tidak valid." }, { status: 400 });
    }

    const validSubdivisionIds = new Set(selectedDivisions.flatMap((division) => division.subdivisions.map((subdivision) => subdivision.id)));
    const selectedSubdivisionIds = subdivisionIds.filter((id) => validSubdivisionIds.has(id));
    const divisionRows = selectedDivisions.flatMap<UserDivisionInput>((division) => {
      const subdivisionRows = division.subdivisions
        .filter((subdivision) => selectedSubdivisionIds.includes(subdivision.id))
        .map((subdivision) => ({ divisionId: division.id, subdivisionId: subdivision.id }));

      return subdivisionRows.length ? subdivisionRows : [{ divisionId: division.id, subdivisionId: null }];
    });

    const user = await prisma.user.create({
      data: {
        homeBranch: { connect: { id: data.homeBranchId } },
        fullName: data.fullName,
        chineseName: data.chineseName || null,
        email: data.email,
        phone: data.phone || null,
        memberStatus: data.memberStatus,
        passwordHash: await bcrypt.hash(data.password, 10),
        profilePhotoUrl,
        qiuDaoCardUrl,
        status: "PENDING",
        systemRoles: {
          create: { role: "MEMBER" },
        },
        userDivisions: divisionRows.length ? {
          create: divisionRows,
        } : undefined,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pendaftaran gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
