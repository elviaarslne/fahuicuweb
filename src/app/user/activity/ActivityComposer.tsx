"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function ActivityComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit(formData: FormData) {
    setPosting(true);
    setMessage("");
    const response = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: formData.get("caption"),
        imageUrl: formData.get("imageUrl") || null,
        type: formData.get("type"),
      }),
    });
    const data = await response.json();
    setPosting(false);
    if (!response.ok) {
      setMessage(data.error || "Post gagal disimpan.");
      return;
    }
    setMessage("Post tersimpan.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-[#f4c62b] text-[#1f1f1f] shadow-xl shadow-amber-900/20 transition hover:-translate-y-0.5 hover:bg-[#e8b923] lg:bottom-auto lg:right-[max(2rem,calc((100vw-1180px)/2))] lg:top-24"
        aria-label="Buat activity post"
      >
        <Plus size={25} />
      </button>
      {message ? <p className="fixed bottom-24 right-6 z-30 rounded-full border border-[#e8ddc4] bg-[#fffdf7] px-4 py-2 text-xs font-semibold text-[#6b6254] shadow-lg">{message}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#1f1f1f]/25 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <button className="absolute inset-0" type="button" onClick={() => setOpen(false)} aria-label="Tutup modal" />
          <form action={submit} className="relative w-full rounded-t-3xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-2xl shadow-black/20 sm:max-w-lg sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a17700]">Activity</p>
                <h2 className="mt-1 text-xl font-black text-[#1f1f1f]">Buat post baru</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-[#f8f1de] text-[#1f1f1f]">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <select name="type" className="rounded-2xl border border-[#e8ddc4] bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                <option value="EVENT_PHOTO">Foto event</option>
                <option value="LEARNING_PROGRESS">Progress belajar</option>
                <option value="GRATITUDE">Syukur / apresiasi</option>
                <option value="OTHER">Lainnya</option>
              </select>
              <textarea name="caption" required placeholder="Tulis caption internal..." className="min-h-32 rounded-2xl border border-[#e8ddc4] bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder:text-[#6b6254]/60" />
              <input name="imageUrl" placeholder="URL gambar (opsional)" className="rounded-2xl border border-[#e8ddc4] bg-white px-4 py-3 text-sm text-[#1f1f1f] placeholder:text-[#6b6254]/60" />
            </div>
            <button disabled={posting} className="mt-5 w-full rounded-2xl bg-[#f4c62b] px-4 py-3 text-sm font-black text-[#1f1f1f] transition hover:bg-[#e8b923] disabled:opacity-60">
              {posting ? "Menyimpan..." : "Post"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
