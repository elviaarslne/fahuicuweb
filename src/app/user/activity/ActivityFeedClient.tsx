"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Heart, MessageCircle, Pencil, Plus, Send, X } from "lucide-react";
import { activityPostTypes, activityTypeLabel } from "@/lib/activity";

type Media = {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  orderNumber: number;
  altText?: string | null;
};

type Author = {
  id: string;
  fullName: string;
  chineseName?: string | null;
  email?: string | null;
  username?: string | null;
  profilePhotoUrl?: string | null;
  memberCategory?: string | null;
  homeBranch?: { name: string } | null;
  currentClass?: { name: string } | null;
  userDivisions?: Array<{ division: { name: string }; subdivision?: { name: string } | null }>;
};

type CommentPreview = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
};

type Post = {
  id: string;
  userId: string;
  caption: string;
  type: (typeof activityPostTypes)[number];
  createdAt: string;
  author: Author;
  media: Media[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  commentsPreview: CommentPreview[];
};

type Profile = {
  id: string;
  fullName: string;
  chineseName?: string | null;
  email: string;
  username?: string | null;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  homeBranch: string;
  currentClass?: string | null;
  memberCategory?: string | null;
  divisions: string[];
  postCount: number;
};

const tabs = [
  { key: "feed", label: "Explore" },
  { key: "mine", label: "My Posts" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const emptyState: Record<TabKey, string> = {
  feed: "Belum ada aktivitas internal.",
  mine: "Belum ada post dari kamu.",
};

function displayName(author: Author | Profile) {
  return author.chineseName || author.fullName;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "F";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function branchLine(author: Author) {
  const branch = formatBranchName(author.homeBranch?.name);
  const currentClass = author.currentClass?.name;
  const category = author.memberCategory ? author.memberCategory.replaceAll("_", " ").toLowerCase() : null;
  return [branch, currentClass, category].filter(Boolean).join(" • ") || "Fa Hui Cu";
}

function formatBranchName(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized.includes("telukgong") || normalized.includes("guangli") || normalized.includes("kuangli")) return "Kuang Li";
  return value;
}

function Avatar({ author, large = false }: { author: Pick<Author, "fullName" | "chineseName" | "profilePhotoUrl">; large?: boolean }) {
  const name = author.chineseName || author.fullName;
  return (
    <div className={`${large ? "size-24 text-3xl" : "size-11 text-sm"} grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#FFF8E8] font-black text-[#9A6A00] ring-2 ring-[#F4C62B]/20`}>
      {author.profilePhotoUrl ? <img src={author.profilePhotoUrl} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

function MediaCarousel({ media }: { media: Media[] }) {
  const [index, setIndex] = useState(0);
  if (media.length === 0) return null;
  const item = media[Math.min(index, media.length - 1)];
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#E8DDC4] bg-[#1F1F1F]">
      <div className="grid aspect-[4/3] place-items-center bg-[#FFF8E8]">
        {item.mediaType === "VIDEO" ? (
          <video src={item.mediaUrl} controls className="h-full w-full object-contain" />
        ) : (
          <img src={item.mediaUrl} alt={item.altText || "Activity media"} className="h-full w-full object-cover" />
        )}
      </div>
      {media.length > 1 ? (
        <>
          <button type="button" onClick={() => setIndex((current) => (current - 1 + media.length) % media.length)} className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1F1F1F] shadow-sm">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => setIndex((current) => (current + 1) % media.length)} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1F1F1F] shadow-sm">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
            {media.map((mediaItem, dotIndex) => (
              <span key={mediaItem.id} className={`size-1.5 rounded-full ${dotIndex === index ? "bg-[#F4C62B]" : "bg-white/70"}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MyPostGridCard({ post }: { post: Post }) {
  const cover = post.media[0];
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#E8DDC4] bg-[#FFF8E8]">
      <div className="aspect-square">
        {cover ? (
          cover.mediaType === "VIDEO" ? (
            <video src={cover.mediaUrl} className="h-full w-full object-cover" muted />
          ) : (
            <img src={cover.mediaUrl} alt={cover.altText || post.caption || "Activity post"} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          )
        ) : (
          <div className="grid h-full place-items-center p-5 text-center text-sm font-bold text-[#6B6254]">
            {post.caption || "Activity"}
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-5 bg-[#1F1F1F]/0 text-white opacity-0 transition group-hover:bg-[#1F1F1F]/45 group-hover:opacity-100">
        <span className="inline-flex items-center gap-2 text-sm font-black"><Heart size={18} fill="currentColor" /> {post.likeCount}</span>
        <span className="inline-flex items-center gap-2 text-sm font-black"><MessageCircle size={18} fill="currentColor" /> {post.commentCount}</span>
      </div>
    </article>
  );
}

function CreatePostModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [caption, setCaption] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextPreviews = photos.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  if (!open) return null;

  function resetForm() {
    setCaption("");
    setPhotos([]);
    setMessage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    if (!caption.trim() && photos.length === 0) {
      setSaving(false);
      setMessage("Pilih foto atau tulis caption terlebih dahulu.");
      return;
    }
    const uploadedMedia = [];
    for (const photo of photos) {
      const formData = new FormData();
      formData.append("file", photo);
      const uploadResponse = await fetch("/api/activity/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setSaving(false);
        setMessage(uploadData.error || "Foto gagal diupload.");
        return;
      }
      uploadedMedia.push({ mediaUrl: uploadData.mediaUrl, mediaType: "IMAGE" as const, orderNumber: uploadedMedia.length });
    }

    const response = await fetch("/api/activity/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption,
        type: "EVENT_PHOTO",
        media: uploadedMedia,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error || "Post gagal disimpan.");
      return;
    }
    resetForm();
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#1F1F1F]/30 backdrop-blur-sm sm:place-items-center sm:p-4">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Tutup" />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-5 shadow-2xl sm:max-w-2xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A17700]">Activity</p>
            <h2 className="mt-1 text-2xl font-black text-[#1F1F1F]">Upload Activity</h2>
          </div>
          <button type="button" onClick={() => { resetForm(); onClose(); }} className="grid size-10 place-items-center rounded-full bg-[#F8F1DE] text-[#1F1F1F]"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-4">
          <div className="grid gap-3 rounded-3xl border border-dashed border-[#E8DDC4] bg-[#FFF8E8]/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-[#1F1F1F]">Foto</p>
                <p className="text-sm text-[#6B6254]">Pilih foto dari device kamu. Bisa lebih dari satu.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F4C62B] px-5 py-3 text-sm font-black text-[#1F1F1F] hover:bg-[#E8B923]">
                <Camera size={17} />
                Pilih Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(event) => setPhotos(Array.from(event.target.files || []))}
                />
              </label>
            </div>
            {previews.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((preview, index) => (
                  <div key={preview} className="relative overflow-hidden rounded-2xl border border-[#E8DDC4] bg-white">
                    <img src={preview} alt={`Preview ${index + 1}`} className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            {photos.length > 0 ? (
              <button type="button" onClick={() => setPhotos([])} className="justify-self-start rounded-full border border-[#E8DDC4] bg-white px-4 py-2 text-sm font-bold text-[#6B6254]">Hapus pilihan foto</button>
            ) : null}
          </div>
          <label className="grid gap-2 text-sm font-bold text-[#6B6254]">
            Caption
            <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Tulis caption singkat..." className="min-h-32 rounded-2xl border border-[#E8DDC4] bg-white px-4 py-3 font-normal text-[#1F1F1F]" />
          </label>
        </div>
        {message ? <p className="mt-4 text-sm font-bold text-rose-600">{message}</p> : null}
        <button disabled={saving} className="mt-6 rounded-2xl bg-[#F4C62B] px-6 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923] disabled:opacity-60">{saving ? "Mengupload..." : "Upload"}</button>
      </form>
    </div>
  );
}

function ProfileEditModal({ profile, open, onClose, onUpdated }: { profile: Profile; open: boolean; onClose: () => void; onUpdated: (profile: Partial<Profile>) => void }) {
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(profile.username || "");
    setBio(profile.bio || "");
  }, [profile.username, profile.bio]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/settings/activity-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, bio }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error || "Profil gagal disimpan.");
      return;
    }
    onUpdated({ username: data.user.username, bio: data.user.bio });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#1F1F1F]/30 backdrop-blur-sm sm:place-items-center sm:p-4">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Tutup" />
      <form onSubmit={submit} className="relative w-full rounded-t-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A17700]">Profile Activity</p>
            <h2 className="mt-1 text-2xl font-black text-[#1F1F1F]">Edit username</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-[#F8F1DE] text-[#1F1F1F]"><X size={18} /></button>
        </div>
        <label className="mt-5 grid gap-2 text-sm font-bold text-[#6B6254]">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, "").toLowerCase())} placeholder="contoh: dharma.journey" className="rounded-2xl border border-[#E8DDC4] bg-white px-4 py-3 font-normal text-[#1F1F1F]" />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-bold text-[#6B6254]">
          Bio
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} placeholder="Bio singkat tentang kamu..." className="min-h-24 rounded-2xl border border-[#E8DDC4] bg-white px-4 py-3 font-normal text-[#1F1F1F]" />
        </label>
        <p className="mt-3 text-xs text-[#6B6254]">Username opsional, 3-24 karakter: huruf kecil, angka, titik, dan underscore.</p>
        {message ? <p className="mt-4 text-sm font-bold text-rose-600">{message}</p> : null}
        <button disabled={saving} className="mt-6 rounded-2xl bg-[#F4C62B] px-6 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923] disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan"}</button>
      </form>
    </div>
  );
}

function PostCard({ post, onRefresh }: { post: Post; onRefresh: () => void }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  async function toggleLike() {
    setBusy(true);
    await fetch(`/api/activity/posts/${post.id}/like`, { method: "POST" });
    setBusy(false);
    onRefresh();
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    const response = await fetch(`/api/activity/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    setBusy(false);
    if (response.ok) {
      setComment("");
      onRefresh();
    }
  }

  return (
    <article className="rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-4 shadow-sm shadow-amber-900/5 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar author={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-black text-[#1F1F1F]">{displayName(post.author)}</p>
            {post.author.username ? <p className="text-sm font-semibold text-[#6B6254]">@{post.author.username}</p> : null}
          </div>
          <p className="mt-0.5 text-xs text-[#6B6254]">{branchLine(post.author)} • {formatTime(post.createdAt)}</p>
        </div>
      </div>
      <div className="mt-4"><MediaCarousel media={post.media} /></div>
      {post.caption ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#1F1F1F]">{post.caption}</p> : null}
      <div className="mt-4 flex items-center gap-3 border-t border-[#E8DDC4] pt-4">
        <button type="button" disabled={busy} onClick={toggleLike} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${post.likedByMe ? "bg-[#EFA3C8]/30 text-rose-700" : "bg-[#FFF8E8] text-[#1F1F1F] hover:bg-[#F8F1DE]"}`}>
          <Heart size={17} fill={post.likedByMe ? "currentColor" : "none"} /> {post.likeCount}
        </button>
        <button type="button" onClick={() => setCommentsOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-full bg-[#FFF8E8] px-4 py-2 text-sm font-black text-[#1F1F1F] hover:bg-[#F8F1DE]">
          <MessageCircle size={17} /> {post.commentCount}
        </button>
      </div>
      {commentsOpen ? <div className="mt-4 space-y-3">
        {post.commentsPreview.length > 0 ? post.commentsPreview.map((item) => (
          <div key={item.id} className="rounded-2xl bg-[#FFF8E8]/70 px-4 py-3 text-sm text-[#1F1F1F]">
            <div className="flex items-start justify-between gap-3">
              <p><span className="font-black">{displayName(item.author)}</span> {item.content}</p>
              <button type="button" onClick={() => setComment(`@${item.author.username || displayName(item.author)} `)} className="shrink-0 text-xs font-black text-[#A17700]">Balas</button>
            </div>
          </div>
        )) : <p className="rounded-2xl bg-[#FFF8E8]/70 px-4 py-3 text-sm text-[#6B6254]">Belum ada komentar.</p>}
        <form onSubmit={submitComment} className="flex gap-2">
          <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tambah komentar..." className="min-w-0 flex-1 rounded-full border border-[#E8DDC4] bg-white px-4 py-2 text-sm" />
          <button disabled={busy || !comment.trim()} className="grid size-10 place-items-center rounded-full bg-[#2E7D61] text-white disabled:opacity-45"><Send size={16} /></button>
        </form>
      </div> : null}
    </article>
  );
}

export default function ActivityFeedClient({ profile: initialProfile }: { profile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<TabKey>("feed");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function loadPosts() {
    setLoading(true);
    const response = await fetch("/api/activity/posts", { cache: "no-store" });
    const data = await response.json();
    setPosts(response.ok ? data.posts || [] : []);
    setLoading(false);
  }

  useEffect(() => { void loadPosts(); }, []);

  const filteredPosts = useMemo(() => {
    if (tab === "mine") return posts.filter((post) => post.userId === profile.id);
    return posts;
  }, [posts, profile.id, tab]);

  return (
    <div className="min-h-[70vh] rounded-[2rem] bg-[#FFFDF7] p-4 sm:p-6">
      <section className="rounded-[2rem] border border-[#E8DDC4] bg-gradient-to-br from-[#FFFDF7] via-[#FFF8E8] to-[#F8F1DE] p-5 shadow-sm shadow-amber-900/5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar author={profile} large />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-[#1F1F1F]">{displayName(profile)}</h1>
                <span className="rounded-full bg-[#2E7D61]/12 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#2E7D61]">Internal</span>
              </div>
              {profile.username ? <p className="mt-1 text-sm font-semibold text-[#6B6254]">@{profile.username}</p> : null}
              <p className="mt-1 text-sm text-[#6B6254]">{profile.email}</p>
              {profile.bio ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[#1F1F1F]">{profile.bio}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#E8DDC4] bg-white px-3 py-1 text-xs font-bold text-[#6B6254]">{formatBranchName(profile.homeBranch) || profile.homeBranch}</span>
                {profile.currentClass ? <span className="rounded-full border border-[#E8DDC4] bg-white px-3 py-1 text-xs font-bold text-[#6B6254]">{profile.currentClass}</span> : null}
                {profile.memberCategory ? <span className="rounded-full border border-[#E8DDC4] bg-white px-3 py-1 text-xs font-bold text-[#6B6254]">{profile.memberCategory.replaceAll("_", " ")}</span> : null}
                {profile.divisions.slice(0, 4).map((division) => <span key={division} className="rounded-full border border-[#E8DDC4] bg-white px-3 py-1 text-xs font-bold text-[#6B6254]">{division}</span>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-[#E8DDC4] bg-white px-5 py-3 text-center">
              <p className="text-2xl font-black text-[#1F1F1F]">{profile.postCount}</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6254]">Posts</p>
            </div>
            <button type="button" onClick={() => setProfileOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#E8DDC4] bg-white px-5 py-3 text-sm font-black text-[#1F1F1F]"><Pencil size={16} /> Edit Profile</button>
            <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#F4C62B] px-5 py-3 text-sm font-black text-[#1F1F1F] shadow-sm shadow-amber-900/10 hover:bg-[#E8B923]"><Plus size={17} /> New Post</button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-black transition ${tab === item.key ? "bg-[#1F1F1F] text-white" : "border border-[#E8DDC4] bg-white text-[#1F1F1F] hover:bg-[#FFF8E8]"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="mt-4 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {loading ? <div className="rounded-[2rem] border border-[#E8DDC4] bg-white p-8 text-[#6B6254]">Memuat activity...</div> : null}
          {!loading && filteredPosts.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-[2rem] border border-dashed border-[#E8DDC4] bg-white p-8 text-center">
              <div>
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#FFF8E8] text-[#A17700]"><Camera size={24} /></div>
                <p className="mt-4 font-black text-[#1F1F1F]">{emptyState[tab]}</p>
              </div>
            </div>
          ) : null}
          {tab === "mine" && filteredPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {filteredPosts.map((post) => <MyPostGridCard key={post.id} post={post} />)}
            </div>
          ) : null}
          {tab === "feed" ? filteredPosts.map((post) => <PostCard key={post.id} post={post} onRefresh={loadPosts} />) : null}
        </div>
        <aside className="hidden space-y-4 xl:block">
          <div className="rounded-[2rem] border border-[#E8DDC4] bg-[#FFF8E8] p-5">
            <p className="font-black text-[#1F1F1F]">Explore internal</p>
            <p className="mt-2 text-sm leading-6 text-[#6B6254]">Activity adalah ruang internal lintas cabang. Post yang baik cukup singkat, jelas, dan membantu anggota lain merasa terhubung.</p>
          </div>
          <div className="rounded-[2rem] border border-[#E8DDC4] bg-white p-5">
            <p className="text-sm font-black text-[#1F1F1F]">Simple rule</p>
            <p className="mt-2 text-sm leading-6 text-[#6B6254]">Gunakan activity untuk cerita singkat dan dokumentasi internal. Untuk tugas atau reminder, pakai notifikasi.</p>
          </div>
        </aside>
      </section>

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadPosts} />
      <ProfileEditModal profile={profile} open={profileOpen} onClose={() => setProfileOpen(false)} onUpdated={(next) => setProfile((current) => ({ ...current, ...next }))} />
    </div>
  );
}
