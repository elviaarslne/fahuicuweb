"use client";

import { useState } from "react";

export default function WejanganReflectionForm({
  wejanganId,
  initialAnswer,
  title,
  source,
  uploadDate,
  content,
  creditReward,
}: {
  wejanganId: string;
  initialAnswer?: string | null;
  title: string;
  source?: string | null;
  uploadDate: Date;
  content: string;
  creditReward: number;
}) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    const response = await fetch(`/api/wejangan/${wejanganId}/reflection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: formData.get("answer") }),
    });
    const data = await response.json();
    const creditText = data.creditAwarded ? ` +${data.creditAwarded} credit.` : "";
    setMessage(data.error || `Refleksi tersimpan.${creditText}`);
  }

  return (
    <form action={submit} className="mt-4 space-y-3">
      <div className="rounded-lg border border-black/10 bg-[#fff7e8] p-3">
        <p className="text-sm font-black text-neutral-950">{title}</p>
        <p className="mt-1 text-xs text-neutral-500">{source || "Sumber internal"} • {new Date(uploadDate).toLocaleDateString("id-ID")}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-700">{content}</p>
      </div>
      <p className="text-xs font-bold text-[#9a6a00]">Isi refleksi untuk mendapatkan {creditReward} credit.</p>
      <textarea name="answer" defaultValue={initialAnswer || ""} placeholder="Tulis refleksi singkatmu..." className="min-h-28 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <button className="rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black">Kirim refleksi</button>
      {message ? <p className="text-xs font-medium text-neutral-600">{message}</p> : null}
    </form>
  );
}
