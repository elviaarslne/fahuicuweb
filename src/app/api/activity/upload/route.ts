import { NextResponse } from "next/server";
import { requireActiveActivityUser } from "@/lib/activity";
import { getCurrentUser } from "@/lib/session";
import { saveActivityImageFile } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!requireActiveActivityUser(user)) {
      return NextResponse.json({ error: "Akun aktif diperlukan." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Pilih foto terlebih dahulu." }, { status: 400 });
    }

    const mediaUrl = await saveActivityImageFile(file, `activity-${user!.id}`);
    return NextResponse.json({ mediaUrl, mediaType: "IMAGE" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Foto gagal diupload." }, { status: 500 });
  }
}
