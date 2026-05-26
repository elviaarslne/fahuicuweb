"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Lock, Plus, Send, Sparkles, Trash2, X } from "lucide-react";

type Profile = {
  id: string;
  fullName: string;
  chineseName?: string | null;
  email: string;
  username?: string | null;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  homeBranch?: string | null;
  currentClass?: string | null;
  memberCategory?: string | null;
  divisions: string[];
  postCount: number;
};

type Media = {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  altText?: string | null;
};

type ReactionCount = { emoji: string; count: number };

type Moment = {
  id: string;
  userId: string;
  caption: string;
  type: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    chineseName?: string | null;
    username?: string | null;
    profilePhotoUrl?: string | null;
    homeBranch?: { name?: string | null } | null;
    currentClass?: { name?: string | null } | null;
  };
  media: Media[];
  mediaVisible?: boolean;
  seenByMe?: boolean;
  isOwnMoment?: boolean;
  reactionCounts?: ReactionCount[];
  reactionTotal?: number;
  myReaction?: string | null;
};

const REACTIONS = ["🙏", "❤️", "😊", "✨", "🌸"];

function displayName(user?: Moment["author"] | null) {
  if (!user) return "Fa Hui Cu";
  return user.chineseName ? `${user.chineseName} ${user.fullName}` : user.fullName;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "F";
}

function formatMomentTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function Avatar({ user, size = "md" }: { user?: Moment["author"] | null; size?: "sm" | "md" | "lg" }) {
  const name = displayName(user);
  const sizeClass = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";
  return (
    <div className={`${sizeClass} grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#F4C62B] font-black text-[#1F1F1F] ring-2 ring-[#FFF8E8]`}>
      {user?.profilePhotoUrl ? <img src={user.profilePhotoUrl} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

function ReactionSummary({ counts }: { counts?: ReactionCount[] }) {
  if (!counts?.length) return <span className="text-xs font-semibold text-[#6B6254]">Belum ada reaksi</span>;
  return (
    <span className="text-xs font-bold text-[#1F1F1F]">
      {counts.map((item) => `${item.emoji} ${item.count}`).join("  ")}
    </span>
  );
}

function MomentTile({ moment, onOpen }: { moment: Moment; onOpen: (moment: Moment) => void }) {
  const cover = moment.media[0];
  const locked = Boolean(moment.seenByMe && !moment.isOwnMoment);
  const name = displayName(moment.author);

  return (
    <button
      type="button"
      onClick={() => !locked && onOpen(moment)}
      disabled={locked}
      className="group relative aspect-square overflow-hidden rounded-[2rem] border border-[#E8DDC4] bg-[#FFF8E8] text-left shadow-sm shadow-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-900/10 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
    >
      {cover?.mediaUrl && !locked ? (
        <img
          src={cover.mediaUrl}
          alt="Moment"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#FFF8E8] via-[#F8F1DE] to-[#E8DDC4]">
          <div className="grid place-items-center gap-3 text-center text-[#6B6254]">
            <Lock size={26} />
            <span className="text-sm font-black">Sudah dilihat</span>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{name}</p>
            <p className="text-xs text-white/75">{formatMomentTime(moment.createdAt)}</p>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-black backdrop-blur">{moment.reactionTotal || 0} reaksi</span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#E8DDC4] bg-[#FFFDF7] p-10 text-center text-[#6B6254]">
      <Sparkles className="mx-auto mb-3 text-[#F4C62B]" size={28} />
      <p className="font-semibold">{text}</p>
    </div>
  );
}

function MomentModal({
  moment,
  viewerName,
  onClose,
  onReact,
  onDelete,
}: {
  moment: Moment;
  viewerName: string;
  onClose: () => void;
  onReact: (emoji: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const cover = moment.media[0];
  const [reacting, setReacting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function sendReaction(emoji: string) {
    setReacting(emoji);
    await onReact(emoji);
    setReacting(null);
  }

  async function deleteMoment() {
    if (!confirm("Hapus Moment ini?")) return;
    setDeleting(true);
    await onDelete(moment.id);
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1F1F1F]/70 p-3 backdrop-blur-sm">
      <button type="button" aria-label="Tutup" className="absolute inset-0" onClick={onClose} />
      <article className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] shadow-2xl md:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="relative min-h-[420px] bg-[#1F1F1F]" onContextMenu={(event) => event.preventDefault()}>
          {cover?.mediaUrl ? (
            <img src={cover.mediaUrl} alt="Moment" draggable={false} className="h-full max-h-[92vh] w-full object-contain select-none" />
          ) : (
            <div className="grid h-full min-h-[420px] place-items-center text-white">Moment tidak tersedia.</div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 text-xs font-bold text-white/80">
            Mohon tidak screenshot. Moment ini hanya untuk dilihat sekali.
          </div>
          <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white/75 backdrop-blur">
            Dilihat oleh {viewerName}
          </div>
        </div>
        <div className="flex min-h-0 flex-col bg-[#FFFDF7]">
          <header className="flex items-center justify-between gap-3 border-b border-[#E8DDC4] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar user={moment.author} />
              <div className="min-w-0">
                <p className="truncate font-black text-[#1F1F1F]">{displayName(moment.author)}</p>
                <p className="text-xs font-semibold text-[#6B6254]">{moment.author.username ? `@${moment.author.username}` : formatMomentTime(moment.createdAt)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#E8DDC4] bg-white text-[#1F1F1F]">
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <div className="rounded-3xl border border-[#E8DDC4] bg-[#FFF8E8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A17700]">Reaksi</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendReaction(emoji)}
                    disabled={Boolean(reacting)}
                    className={`rounded-full border px-4 py-2 text-2xl transition hover:-translate-y-0.5 ${moment.myReaction === emoji ? "border-[#F4C62B] bg-[#F4C62B]" : "border-[#E8DDC4] bg-white"}`}
                  >
                    {reacting === emoji ? <Loader2 className="animate-spin" size={20} /> : emoji}
                  </button>
                ))}
              </div>
              <div className="mt-4"><ReactionSummary counts={moment.reactionCounts} /></div>
            </div>
            {moment.isOwnMoment ? (
              <button
                type="button"
                onClick={deleteMoment}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Hapus Moment
              </button>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function ActivityFeedClient({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<"explore" | "mine">("explore");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const viewerName = profile.username ? `@${profile.username}` : profile.fullName;

  async function loadMoments() {
    setLoading(true);
    const response = await fetch("/api/activity/posts", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) {
      setMessage(data?.error || "Gagal memuat Moments.");
      return;
    }
    setMoments(data.posts || []);
  }

  useEffect(() => {
    loadMoments();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const visibleMoments = useMemo(() => moments.filter((moment) => moment.media.length > 0 || moment.seenByMe), [moments]);
  const myMoments = useMemo(() => moments.filter((moment) => moment.userId === profile.id), [moments, profile.id]);
  const gridMoments = tab === "mine" ? myMoments : visibleMoments.filter((moment) => moment.userId !== profile.id);

  function chooseFile(file?: File | null) {
    setMessage("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Pilih file gambar untuk Moment.");
      return;
    }
    setSelectedFile(file);
  }

  async function uploadMoment() {
    if (!selectedFile) {
      setMessage("Pilih foto terlebih dahulu.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const uploadResponse = await fetch("/api/activity/upload", { method: "POST", body: form });
      const uploadData = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) throw new Error(uploadData?.error || "Upload foto gagal.");

      const postResponse = await fetch("/api/activity/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: null,
          type: "OTHER",
          media: [{ mediaUrl: uploadData.mediaUrl, mediaType: "IMAGE", orderNumber: 0 }],
        }),
      });
      const postData = await postResponse.json().catch(() => null);
      if (!postResponse.ok) throw new Error(postData?.error || "Moment gagal dikirim.");

      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setMessage("Moment terkirim.");
      setTab("mine");
      await loadMoments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moment gagal dikirim.");
    } finally {
      setUploading(false);
    }
  }

  async function openMoment(moment: Moment) {
    if (moment.seenByMe && !moment.isOwnMoment) return;
    setSelectedMoment(moment);
    if (!moment.isOwnMoment) {
      await fetch(`/api/activity/posts/${moment.id}/view`, { method: "POST" }).catch(() => null);
    }
  }

  async function closeMoment() {
    setSelectedMoment(null);
    await loadMoments();
  }

  async function reactToMoment(emoji: string) {
    if (!selectedMoment) return;
    const response = await fetch(`/api/activity/posts/${selectedMoment.id}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Reaksi gagal dikirim.");
      return;
    }
    setSelectedMoment((current) => current ? { ...current, ...data } : current);
  }

  async function deleteMoment(id: string) {
    const response = await fetch(`/api/activity/posts/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Moment gagal dihapus.");
      return;
    }
    setSelectedMoment(null);
    setMessage("Moment dihapus.");
    await loadMoments();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] shadow-sm shadow-amber-900/5">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_360px] md:p-7">
          <div className="flex items-center gap-4">
            <Avatar user={{ id: profile.id, fullName: profile.fullName, chineseName: profile.chineseName, username: profile.username, profilePhotoUrl: profile.profilePhotoUrl }} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A17700]">Moments</p>
              <h1 className="mt-1 text-3xl font-black text-[#1F1F1F]">Bagikan momen apa adanya.</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#6B6254]">
                {profile.username ? <span className="rounded-full bg-[#FFF8E8] px-3 py-1">@{profile.username}</span> : null}
                {profile.homeBranch ? <span className="rounded-full bg-[#FFF8E8] px-3 py-1">{profile.homeBranch}</span> : null}
                {profile.currentClass ? <span className="rounded-full bg-[#FFF8E8] px-3 py-1">{profile.currentClass}</span> : null}
                <span className="rounded-full bg-[#FFF8E8] px-3 py-1">{myMoments.length} Moment</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#E8DDC4] bg-[#FFF8E8] p-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img src={previewUrl} alt="Preview Moment" className="aspect-square w-full rounded-[1.5rem] object-cover" />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full border border-[#E8DDC4] bg-white px-4 py-3 text-sm font-black text-[#1F1F1F]">Ganti Foto</button>
                  <button type="button" onClick={uploadMoment} disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F4C62B] px-4 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923] disabled:opacity-60">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    Kirim Moment
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} className="grid min-h-56 w-full place-items-center rounded-[1.5rem] border border-dashed border-[#D7C9A7] bg-[#FFFDF7] text-center transition hover:bg-white">
                <span className="grid place-items-center gap-3">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[#F4C62B] text-[#1F1F1F]"><Camera size={28} /></span>
                  <span className="text-lg font-black text-[#1F1F1F]">Ambil Moment</span>
                  <span className="text-sm font-semibold text-[#6B6254]">Tanpa edit. Tanpa caption. Apa adanya.</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {message ? <p className="rounded-full border border-[#E8DDC4] bg-[#FFFDF7] px-4 py-3 text-sm font-bold text-[#6B6254]">{message}</p> : null}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border border-[#E8DDC4] bg-[#FFFDF7] p-1">
            <button type="button" onClick={() => setTab("explore")} className={`rounded-full px-5 py-2 text-sm font-black transition ${tab === "explore" ? "bg-[#F4C62B] text-[#1F1F1F]" : "text-[#6B6254] hover:bg-[#FFF8E8]"}`}>Explore</button>
            <button type="button" onClick={() => setTab("mine")} className={`rounded-full px-5 py-2 text-sm font-black transition ${tab === "mine" ? "bg-[#F4C62B] text-[#1F1F1F]" : "text-[#6B6254] hover:bg-[#FFF8E8]"}`}>My Moments</button>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-[#1F1F1F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
            <Plus size={17} /> Moment Baru
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-10 text-[#6B6254]"><Loader2 className="animate-spin" /></div>
        ) : gridMoments.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gridMoments.map((moment) => <MomentTile key={moment.id} moment={moment} onOpen={openMoment} />)}
          </div>
        ) : (
          <EmptyState text={tab === "mine" ? "Belum ada Moment dari kamu." : "Belum ada Moment baru."} />
        )}
      </section>

      {selectedMoment ? (
        <MomentModal
          moment={selectedMoment}
          viewerName={viewerName}
          onClose={closeMoment}
          onReact={reactToMoment}
          onDelete={deleteMoment}
        />
      ) : null}
    </main>
  );
}
