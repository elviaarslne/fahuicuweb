import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const allowedActivityImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"]);

export async function saveRegistrationFile(file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  if (!allowedTypes.has(file.type)) {
    throw new Error("File harus berupa JPG, PNG, atau WEBP.");
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 3MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${prefix}-${nanoid(10)}.${ext}`;
  const relativePath = `/uploads/registration/${filename}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "registration");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return relativePath;
}

export async function saveActivityImageFile(file: File | null, prefix: string) {
  if (!file || file.size === 0) return null;
  if (!allowedActivityImageTypes.has(file.type)) {
    throw new Error("File harus berupa JPG, PNG, WEBP, atau GIF.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Ukuran foto maksimal 8MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${prefix}-${nanoid(10)}.${ext}`;
  const relativePath = `/uploads/activity/${filename}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "activity");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return relativePath;
}
