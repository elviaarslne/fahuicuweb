"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ChevronRight, Inbox, Loader2, Lock, Send, Sparkles, Trash2, X } from "lucide-react";

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

type PrivateMessage = {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
    chineseName?: string | null;
    username?: string | null;
    profilePhotoUrl?: string | null;
  } | null;
};

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
  privateMessages?: PrivateMessage[];
  privateMessageCount?: number;
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
  return <span className="text-xs font-bold text-[#1F1F1F]">{counts.map((item) => `${item.emoji} ${item.count}`).join("  ")}</span>;
}

function EmptyState({ text, cta, onCta }: { text: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#E8DDC4] bg-[#FFFDF7] p-10 text-center text-[#6B6254]">
      <Sparkles className="mx-auto mb-3 text-[#F4C62B]" size={28} />
      <p className="font-semibold">{text}</p>
      {cta && onCta ? (
        <button type="button" onClick={onCta} className="mt-5 rounded-full bg-[#F4C62B] px-5 py-2.5 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923]">
          {cta}
        </button>
      ) : null}
    </div>
  );
}

function MyMomentTile({ moment, onOpen }: { moment: Moment; onOpen: (moment: Moment) => void }) {
  const cover = moment.media[0];
  return (
    <button
      type="button"
      onClick={() => onOpen(moment)}
      className="group relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#E8DDC4] bg-[#FFF8E8] text-left shadow-sm shadow-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-900/10"
    >
      {cover?.mediaUrl ? (
        <img
          src={cover.mediaUrl}
          alt="Moment saya"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#FFF8E8] via-[#F8F1DE] to-[#E8DDC4] text-[#6B6254]">
          <Lock size={24} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <p className="text-xs font-bold text-white/75">{formatMomentTime(moment.createdAt)}</p>
        <p className="mt-1 text-sm font-black">{moment.reactionTotal || 0} reaksi · {moment.privateMessageCount || 0} pesan</p>
      </div>
    </button>
  );
}

function StoryModal({
  queue,
  initialIndex = 0,
  viewerName,
  ownerMode = false,
  onClose,
  onReact,
  onDelete,
  onViewed,
  onSendMessage,
}: {
  queue: Moment[];
  initialIndex?: number;
  viewerName: string;
  ownerMode?: boolean;
  onClose: () => void;
  onReact: (momentId: string, emoji: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewed: (momentId: string) => Promise<void>;
  onSendMessage: (momentId: string, content: string) => Promise<void>;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [done, setDone] = useState(queue.length === 0);
  const [reacting, setReacting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageState, setMessageState] = useState("");
  const viewedRef = useRef(new Set<string>());
  const current = queue[index];
  const cover = current?.media[0];

  useEffect(() => {
    setIndex(initialIndex);
    setDone(queue.length === 0);
    viewedRef.current = new Set<string>();
  }, [initialIndex, queue]);

  useEffect(() => {
    if (!current || ownerMode || viewedRef.current.has(current.id)) return;
    viewedRef.current.add(current.id);
    void onViewed(current.id);
  }, [current, ownerMode, onViewed]);

  async function sendReaction(emoji: string) {
    if (!current) return;
    setReacting(emoji);
    await onReact(current.id, emoji);
    setReacting(null);
  }

  async function sendPrivateMessage() {
    if (!current || !messageText.trim()) return;
    const content = messageText.trim();
    setMessageState("Mengirim...");
    await onSendMessage(current.id, content);
    setMessageText("");
    setMessageState("Pesan terkirim.");
    window.setTimeout(() => setMessageState(""), 1800);
  }

  async function deleteMoment() {
    if (!current || !confirm("Hapus Moment ini?")) return;
    setDeleting(true);
    await onDelete(current.id);
    setDeleting(false);
  }

  function goNext() {
    if (index + 1 >= queue.length) {
      setDone(true);
      return;
    }
    setMessageText("");
    setMessageState("");
    setIndex((value) => value + 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1F1F]/85 p-3 backdrop-blur-sm md:p-6">
      <article className="relative mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] text-white shadow-2xl">
        <div className="absolute inset-x-0 top-0 z-20 space-y-3 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex gap-1.5">
            {queue.map((item, itemIndex) => (
              <span key={item.id} className={`h-1 flex-1 rounded-full ${done || itemIndex < index ? "bg-white" : itemIndex === index ? "bg-[#F4C62B]" : "bg-white/25"}`} />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            {current ? (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={current.author} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{displayName(current.author)}</p>
                  <p className="text-xs text-white/70">{formatMomentTime(current.createdAt)}</p>
                </div>
              </div>
            ) : <span />}
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
              <X size={18} />
            </button>
          </div>
        </div>

        {done ? (
          <div className="grid flex-1 place-items-center bg-[#FFFDF7] p-8 text-center text-[#1F1F1F]">
            <div>
              <Sparkles className="mx-auto mb-4 text-[#F4C62B]" size={36} />
              <h2 className="text-2xl font-black">Semua Moments sudah kamu lihat.</h2>
              <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#F4C62B] px-6 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923]">Tutup</button>
            </div>
          </div>
        ) : current ? (
          <>
            <button type="button" aria-label="Moment berikutnya" onClick={goNext} className="absolute inset-y-0 right-0 z-10 w-1/2" />
            <div className="relative grid flex-1 place-items-center bg-black" onContextMenu={(event) => event.preventDefault()}>
              {cover?.mediaUrl ? (
                <img src={cover.mediaUrl} alt="Moment" draggable={false} className="max-h-full max-w-full select-none object-contain" />
              ) : (
                <div className="grid h-full w-full place-items-center text-white/80">Moment tidak tersedia.</div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-28 mx-auto max-w-fit rounded-full bg-black/35 px-4 py-1.5 text-xs font-bold text-white/80 backdrop-blur">
                Dilihat oleh {viewerName}
              </div>
            </div>

            <div className="z-20 space-y-3 border-t border-white/10 bg-black/75 p-4 backdrop-blur">
              <p className="text-center text-xs font-semibold text-white/70">Mohon tidak screenshot. Moment ini hanya untuk dilihat sekali.</p>
              <div className="flex items-center justify-center gap-2">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendReaction(emoji)}
                    disabled={Boolean(reacting)}
                    className={`grid h-12 w-12 place-items-center rounded-full border text-2xl transition hover:-translate-y-0.5 ${current.myReaction === emoji ? "border-[#F4C62B] bg-[#F4C62B]" : "border-white/15 bg-white/10"}`}
                  >
                    {reacting === emoji ? <Loader2 className="animate-spin" size={18} /> : emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {ownerMode ? (
                  <div className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80"><ReactionSummary counts={current.reactionCounts} /></div>
                ) : (
                  <>
                    <input
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Tulis pesan singkat"
                      className="min-w-0 flex-1 rounded-full border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-[#1F1F1F] outline-none placeholder:text-[#6B6254]/70"
                      onClick={(event) => event.stopPropagation()}
                    />
                    <button type="button" onClick={sendPrivateMessage} className="rounded-full bg-[#F4C62B] px-4 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923]">Kirim pesan</button>
                  </>
                )}
                <button type="button" onClick={goNext} className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#1F1F1F] transition hover:bg-[#F4C62B]" aria-label="Moment berikutnya">
                  <ChevronRight size={22} />
                </button>
              </div>
              {messageState ? <p className="text-center text-xs font-bold text-[#F4C62B]">{messageState}</p> : null}
              {ownerMode ? (
                <div className="rounded-2xl bg-white/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/65"><Inbox size={14} /> Pesan diterima</div>
                  {current.privateMessages?.length ? (
                    <div className="space-y-2">
                      {current.privateMessages.map((message) => (
                        <div key={message.id} className="rounded-xl bg-white/10 px-3 py-2 text-sm">
                          <p className="font-black">{displayName(message.author as any)}</p>
                          <p className="text-white/80">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-white/65">Belum ada pesan.</p>}
                  <button type="button" onClick={deleteMoment} disabled={deleting} className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300/40 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/15 disabled:opacity-60">
                    {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Hapus Moment
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}

export default function ActivityFeedClient({ profile }: { profile: Profile }) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storyQueue, setStoryQueue] = useState<Moment[] | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const viewerName = profile.username ? `@${profile.username}` : profile.fullName;

  async function loadMoments() {
    setLoading(true);
    const response = await fetch("/api/activity/posts?mode=queue", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) {
      setMessage(data?.error || "Gagal memuat Moments.");
      return;
    }
    setMoments(data.posts || []);
  }

  useEffect(() => { void loadMoments(); }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const unseenQueue = useMemo(() => {
    return moments
      .filter((moment) => moment.userId !== profile.id && !moment.seenByMe && moment.media.length > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [moments, profile.id]);

  const myMoments = useMemo(() => {
    return moments
      .filter((moment) => moment.userId === profile.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [moments, profile.id]);

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
      await loadMoments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moment gagal dikirim.");
    } finally {
      setUploading(false);
    }
  }

  function openQueue() {
    if (!unseenQueue.length) return;
    setStoryQueue(unseenQueue);
    setStoryIndex(0);
  }

  function openOwnMoment(moment: Moment) {
    setStoryQueue([moment]);
    setStoryIndex(0);
  }

  async function closeStory() {
    setStoryQueue(null);
    await loadMoments();
  }

  async function markViewed(momentId: string) {
    await fetch(`/api/activity/posts/${momentId}/view`, { method: "POST" }).catch(() => null);
    setMoments((current) => current.map((moment) => moment.id === momentId ? { ...moment, seenByMe: true } : moment));
  }

  async function reactToMoment(momentId: string, emoji: string) {
    const response = await fetch(`/api/activity/posts/${momentId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Reaksi gagal dikirim.");
      return;
    }
    const patch = (moment: Moment) => moment.id === momentId ? { ...moment, ...data } : moment;
    setMoments((current) => current.map(patch));
    setStoryQueue((current) => current ? current.map(patch) : current);
  }

  async function sendPrivateMessage(momentId: string, content: string) {
    const response = await fetch(`/api/activity/posts/${momentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) setMessage(data?.error || "Pesan gagal dikirim.");
  }

  async function deleteMoment(id: string) {
    const response = await fetch(`/api/activity/posts/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Moment gagal dihapus.");
      return;
    }
    setStoryQueue(null);
    setMessage("Moment dihapus.");
    await loadMoments();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] shadow-sm shadow-amber-900/5">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_340px] md:p-7">
          <div className="flex items-center gap-4">
            <Avatar user={{ id: profile.id, fullName: profile.fullName, chineseName: profile.chineseName, username: profile.username, profilePhotoUrl: profile.profilePhotoUrl }} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A17700]">Moments</p>
              <h1 className="mt-1 text-3xl font-black text-[#1F1F1F]">Lihat sekali, apa adanya.</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#6B6254]">
                {profile.username ? <span className="rounded-full bg-[#FFF8E8] px-3 py-1">@{profile.username}</span> : null}
                {profile.homeBranch ? <span className="rounded-full bg-[#FFF8E8] px-3 py-1">{profile.homeBranch}</span> : null}
                {profile.currentClass ? <span className="rounded-full bg-[#FFF8E8] px-3 py-1">{profile.currentClass}</span> : null}
                <span className="rounded-full bg-[#FFF8E8] px-3 py-1">{myMoments.length} Moment</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#E8DDC4] bg-[#FFF8E8] p-4">
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
            {previewUrl ? (
              <div className="space-y-3">
                <img src={previewUrl} alt="Preview Moment" className="aspect-square w-full rounded-[1.5rem] object-cover" />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full border border-[#E8DDC4] bg-white px-4 py-3 text-sm font-black text-[#1F1F1F]">Ganti Foto</button>
                  <button type="button" onClick={uploadMoment} disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F4C62B] px-4 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#E8B923] disabled:opacity-60">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Kirim Moment
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} className="grid min-h-48 w-full place-items-center rounded-[1.5rem] border border-dashed border-[#D7C9A7] bg-[#FFFDF7] text-center transition hover:bg-white">
                <span className="grid place-items-center gap-3">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[#F4C62B] text-[#1F1F1F]"><Camera size={28} /></span>
                  <span className="text-lg font-black text-[#1F1F1F]">Ambil Moment</span>
                  <span className="text-sm font-semibold text-[#6B6254]">Tanpa edit. Tanpa caption.</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {message ? <p className="rounded-full border border-[#E8DDC4] bg-[#FFFDF7] px-4 py-3 text-sm font-bold text-[#6B6254]">{message}</p> : null}

      <section className="rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-5 shadow-sm shadow-amber-900/5 md:p-7">
        {loading ? (
          <div className="grid min-h-36 place-items-center text-[#6B6254]"><Loader2 className="animate-spin" /></div>
        ) : unseenQueue.length ? (
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A17700]">View Queue</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F1F1F]">{unseenQueue.length} Moments belum dilihat</h2>
              <p className="mt-1 text-sm font-semibold text-[#6B6254]">Dimulai dari Moment paling lama yang belum kamu lihat.</p>
            </div>
            <button type="button" onClick={openQueue} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F1F1F] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              Lihat Moments <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <EmptyState text="Semua Moments sudah kamu lihat." cta="Bagikan Moment baru" onCta={() => inputRef.current?.click()} />
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A17700]">Owner History</p>
            <h2 className="mt-1 text-2xl font-black text-[#1F1F1F]">My Moments</h2>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#E8DDC4] bg-[#FFFDF7] px-5 py-3 text-sm font-black text-[#1F1F1F] transition hover:bg-[#FFF8E8]"><Camera size={17} /> Ambil Moment</button>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-10 text-[#6B6254]"><Loader2 className="animate-spin" /></div>
        ) : myMoments.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {myMoments.map((moment) => <MyMomentTile key={moment.id} moment={moment} onOpen={openOwnMoment} />)}
          </div>
        ) : (
          <EmptyState text="Belum ada Moment dari kamu." cta="Ambil Moment" onCta={() => inputRef.current?.click()} />
        )}
      </section>

      {storyQueue ? (
        <StoryModal
          queue={storyQueue}
          initialIndex={storyIndex}
          ownerMode={storyQueue.every((moment) => moment.userId === profile.id)}
          viewerName={viewerName}
          onClose={closeStory}
          onReact={reactToMoment}
          onDelete={deleteMoment}
          onViewed={markViewed}
          onSendMessage={sendPrivateMessage}
        />
      ) : null}
    </main>
  );
}
