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
export const momentReactionEmojis = ["🙏", "❤️", "😊", "✨", "🌸"] as const;

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
  message: "Pilih foto terlebih dahulu.",
});

export const momentReactionInputSchema = z.object({
  emoji: z.enum(momentReactionEmojis),
});

export function serializeActivityPost(post: any, currentUserId?: string) {
  const legacyMedia = post.legacyImageUrl && (!post.media || post.media.length === 0)
    ? [{ id: `${post.id}:legacy`, postId: post.id, mediaUrl: post.legacyImageUrl, mediaType: "IMAGE", orderNumber: 0, altText: post.caption || "Moment image", createdAt: post.createdAt }]
    : [];
  const rawMedia = [...(post.media || []), ...legacyMedia].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
  const visibleComments = (post.comments || []).filter((comment: any) => !comment.deletedAt && !comment.isHiddenByAdmin);
  const likes = post.likes || [];
  const views = post.views || [];
  const reactions = post.reactions || [];
  const isOwnMoment = Boolean(currentUserId && post.userId === currentUserId);
  const seenByMe = Boolean(currentUserId && !isOwnMoment && views.some((view: any) => view.viewerId === currentUserId));
  const mediaVisible = isOwnMoment || !seenByMe;
  const reactionCounts = momentReactionEmojis.map((emoji) => ({
    emoji,
    count: reactions.filter((reaction: any) => reaction.emoji === emoji).length,
  })).filter((item) => item.count > 0);
  const myReaction = currentUserId ? reactions.find((reaction: any) => reaction.userId === currentUserId)?.emoji || null : null;

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
    media: mediaVisible ? rawMedia : [],
    mediaVisible,
    seenByMe,
    isOwnMoment,
    viewedAt: views.find((view: any) => view.viewerId === currentUserId)?.viewedAt || null,
    reactionCounts,
    reactionTotal: reactions.length,
    myReaction,
    likeCount: likes.length,
    commentCount: isOwnMoment ? visibleComments.length : 0,
    privateMessageCount: isOwnMoment ? visibleComments.length : 0,
    likedByMe: currentUserId ? likes.some((like: any) => like.userId === currentUserId) : false,
    commentsPreview: isOwnMoment ? visibleComments.slice(0, 3).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      isHiddenByAdmin: comment.isHiddenByAdmin,
      author: comment.user,
    })) : [],
    privateMessages: isOwnMoment ? visibleComments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.user,
    })) : [],
  };
}
