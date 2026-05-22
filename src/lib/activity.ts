import { z } from "zod";
import { isContentManager } from "@/lib/admin-content";

export const activityPostTypes = [
  "EVENT_PHOTO",
  "LEARNING_PROGRESS",
  "SERVICE",
  "GRATITUDE",
  "DOCUMENTATION",
  "OTHER",
] as const;

export const activityMediaTypes = ["IMAGE", "VIDEO"] as const;

export const activityTypeLabel: Record<(typeof activityPostTypes)[number], string> = {
  EVENT_PHOTO: "Foto event",
  LEARNING_PROGRESS: "Progress belajar",
  SERVICE: "Pelayanan",
  GRATITUDE: "Syukur",
  DOCUMENTATION: "Dokumentasi",
  OTHER: "Lainnya",
};

export const usernameRegex = /^[a-z0-9_.]{3,24}$/;

export function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/^@/, "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function validateUsername(value: string | null) {
  if (!value) return null;
  if (!usernameRegex.test(value)) {
    return "Username hanya boleh huruf kecil, angka, titik, dan underscore.";
  }
  return null;
}

export function requireActiveActivityUser(user: { status?: string } | null) {
  return Boolean(user && user.status === "ACTIVE");
}

export function canModerateActivity(user: { id: string; homeBranchId: string; systemRoles: Array<{ role: string }> } | null) {
  return isContentManager(user);
}

export const activityMediaInputSchema = z.object({
  mediaUrl: z.string().trim().min(1, "Media URL wajib diisi."),
  mediaType: z.enum(activityMediaTypes).default("IMAGE"),
  orderNumber: z.coerce.number().int().min(0).default(0),
  altText: z.string().trim().optional().nullable(),
});

export const activityPostInputSchema = z.object({
  caption: z.string().trim().optional().nullable(),
  type: z.enum(activityPostTypes).default("OTHER"),
  media: z.array(activityMediaInputSchema).default([]),
}).refine((data) => Boolean(data.caption?.trim()) || data.media.length > 0, {
  message: "Isi caption atau tambahkan media terlebih dahulu.",
});

export function serializeActivityPost(post: any, currentUserId?: string) {
  const legacyMedia = post.legacyImageUrl && (!post.media || post.media.length === 0)
    ? [{ id: `${post.id}:legacy`, postId: post.id, mediaUrl: post.legacyImageUrl, mediaType: "IMAGE", orderNumber: 0, altText: post.caption || "Activity image", createdAt: post.createdAt }]
    : [];
  const media = [...(post.media || []), ...legacyMedia].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
  const visibleComments = (post.comments || []).filter((comment: any) => !comment.deletedAt && !comment.isHiddenByAdmin);
  const likes = post.likes || [];
  return {
    id: post.id,
    userId: post.userId,
    caption: post.caption || "",
    type: post.type,
    visibility: post.visibility,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isHiddenByAdmin: post.isHiddenByAdmin,
    deletedAt: post.deletedAt,
    author: post.user,
    media,
    likeCount: likes.length,
    commentCount: visibleComments.length,
    likedByMe: currentUserId ? likes.some((like: any) => like.userId === currentUserId) : false,
    commentsPreview: visibleComments.slice(0, 3).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      isHiddenByAdmin: comment.isHiddenByAdmin,
      author: comment.user,
    })),
  };
}
