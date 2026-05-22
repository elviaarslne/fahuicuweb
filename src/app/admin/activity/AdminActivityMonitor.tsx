"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { activityPostTypes, activityTypeLabel } from "@/lib/activity";

type Branch = { id: string; name: string };
type Post = {
  id: string;
  caption: string;
  type: (typeof activityPostTypes)[number];
  createdAt: string;
  isHiddenByAdmin: boolean;
  deletedAt?: string | null;
  author: { id: string; fullName: string; chineseName?: string | null; email?: string | null; username?: string | null; homeBranch?: Branch | null };
  media: Array<{ id: string; mediaUrl: string; mediaType: string }>;
  likeCount: number;
  commentCount: number;
  commentsPreview: Array<{ id: string; content: string; isHiddenByAdmin: boolean; author: { fullName: string; chineseName?: string | null; username?: string | null } }>;
};

function nameOf(author: Post["author"]) {
  return author.chineseName || author.fullName;
}

export default function AdminActivityMonitor() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ user: "", branch: "", category: "", visibility: "" });

  const params = useMemo(() => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
    return query.toString();
  }, [filters]);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/admin/activity${params ? `?${params}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setPosts(data.posts || []);
      setBranches(data.branches || []);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [params]);

  async function togglePost(post: Post) {
    await fetch(`/api/admin/activity/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHiddenByAdmin: !post.isHiddenByAdmin }),
    });
    await load();
  }

  async function toggleComment(commentId: string, hidden: boolean) {
    await fetch(`/api/activity/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHiddenByAdmin: !hidden }),
    });
    await load();
  }

  function submitFilters(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#E8DDC4] bg-[#FFFDF7] p-6 shadow-sm shadow-amber-900/5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A17700]">Moderation</p>
        <h1 className="mt-2 text-3xl font-black text-[#1F1F1F]">Activity Monitor</h1>
        <p className="mt-2 text-sm text-[#6B6254]">Post muncul langsung di user end. Admin dapat filter, hide/unhide post, dan hide/unhide komentar.</p>
      </section>

      <form onSubmit={submitFilters} className="grid gap-3 rounded-[2rem] border border-[#E8DDC4] bg-white p-4 md:grid-cols-4">
        <input value={filters.user} onChange={(event) => setFilters((current) => ({ ...current, user: event.target.value }))} placeholder="Cari user" className="rounded-2xl border border-[#E8DDC4] px-4 py-3 text-sm" />
        <select value={filters.branch} onChange={(event) => setFilters((current) => ({ ...current, branch: event.target.value }))} className="rounded-2xl border border-[#E8DDC4] px-4 py-3 text-sm">
          <option value="">Semua cabang</option>
          {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
        <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-[#E8DDC4] px-4 py-3 text-sm">
          <option value="">Semua kategori</option>
          {activityPostTypes.map((type) => <option key={type} value={type}>{activityTypeLabel[type]}</option>)}
        </select>
        <select value={filters.visibility} onChange={(event) => setFilters((current) => ({ ...current, visibility: event.target.value }))} className="rounded-2xl border border-[#E8DDC4] px-4 py-3 text-sm">
          <option value="">Semua status</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </form>

      <section className="space-y-4">
        {loading ? <div className="rounded-[2rem] border border-[#E8DDC4] bg-white p-6 text-[#6B6254]">Memuat activity...</div> : null}
        {!loading && posts.length === 0 ? <div className="rounded-[2rem] border border-dashed border-[#E8DDC4] bg-white p-6 text-[#6B6254]">Tidak ada activity sesuai filter.</div> : null}
        {posts.map((post) => (
          <article key={post.id} className="rounded-[2rem] border border-[#E8DDC4] bg-white p-5 shadow-sm shadow-amber-900/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-[#1F1F1F]">{nameOf(post.author)} {post.author.username ? <span className="text-sm font-semibold text-[#6B6254]">@{post.author.username}</span> : null}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B6254]">{post.author.email} • {post.author.homeBranch?.name || "-"} • {activityTypeLabel[post.type]} • {new Date(post.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${post.isHiddenByAdmin ? "bg-rose-100 text-rose-700" : "bg-[#2E7D61]/12 text-[#2E7D61]"}`}>{post.isHiddenByAdmin ? "HIDDEN" : "VISIBLE"}</span>
                <button type="button" onClick={() => togglePost(post)} className="rounded-full border border-[#E8DDC4] px-4 py-2 text-sm font-black text-[#1F1F1F]">{post.isHiddenByAdmin ? "Unhide" : "Hide"}</button>
              </div>
            </div>
            {post.caption ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#1F1F1F]">{post.caption}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#6B6254]">
              <span>{post.media.length} media</span>
              <span>{post.likeCount} likes</span>
              <span>{post.commentCount} comments</span>
            </div>
            {post.commentsPreview.length > 0 ? (
              <div className="mt-4 space-y-2 rounded-2xl bg-[#FFF8E8] p-3">
                {post.commentsPreview.map((comment) => (
                  <div key={comment.id} className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                    <p><span className="font-black">{comment.author.chineseName || comment.author.fullName}</span> {comment.content}</p>
                    <button type="button" onClick={() => toggleComment(comment.id, comment.isHiddenByAdmin)} className="shrink-0 text-xs font-black text-[#A17700]">{comment.isHiddenByAdmin ? "Unhide" : "Hide"}</button>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
