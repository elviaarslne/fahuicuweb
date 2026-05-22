"use client";

import { useState } from "react";

export default function ModuleProgressForm({ moduleId, initialNotes, initialPhotoUrl, initialCompleted }: { moduleId: string; initialNotes?: string | null; initialPhotoUrl?: string | null; initialCompleted?: boolean }) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    const response = await fetch(`/api/learning-modules/${moduleId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isCompleted: formData.get("isCompleted") === "on",
        completedAt: formData.get("completedAt") || null,
        notes: formData.get("notes") || null,
        photoUrl: formData.get("photoUrl") || null,
      }),
    });
    const data = await response.json();
    setMessage(data.error || "Progress modul tersimpan.");
  }

  return (
    <form action={submit} className="mt-4 space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
        <input name="isCompleted" type="checkbox" defaultChecked={initialCompleted} className="h-4 w-4 accent-[#f4b63f]" />
        Tandai selesai
      </label>
      <input name="completedAt" type="date" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <textarea name="notes" defaultValue={initialNotes || ""} placeholder="Catatan pembelajaran pribadi" className="min-h-24 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <input name="photoUrl" defaultValue={initialPhotoUrl || ""} placeholder="URL foto bukti belajar (opsional)" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <button className="rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black">Simpan progress</button>
      {message ? <p className="text-xs font-medium text-neutral-600">{message}</p> : null}
    </form>
  );
}
