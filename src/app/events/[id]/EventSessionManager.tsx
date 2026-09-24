"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EventSessionManager({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    const response = await fetch(`/api/events/${eventId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description") || null,
        startAt: formData.get("startAt") || null,
        endAt: formData.get("endAt") || null,
        speakerId: formData.get("speakerId") || null,
        trainerId: formData.get("trainerId") || null,
        orderNumber: formData.get("orderNumber") || 0,
        materialUrl: formData.get("materialUrl") || null,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Sesi/topik tersimpan.");
      router.refresh();
    } else {
      setMessage(data.error || "Gagal menyimpan sesi/topik.");
    }
  }

  return (
    <form action={submit} className="mt-5 rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-semibold text-neutral-950">Tambah sesi/topik</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input name="title" placeholder="Judul sesi" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input name="orderNumber" type="number" placeholder="Urutan" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input name="startAt" type="datetime-local" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input name="endAt" type="datetime-local" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input name="speakerId" placeholder="Speaker user ID opsional" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input name="trainerId" placeholder="Trainer user ID opsional" className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input name="materialUrl" placeholder="Material URL opsional" className="rounded-lg border border-black/10 px-3 py-2 text-sm md:col-span-2" />
        <textarea name="description" placeholder="Deskripsi sesi" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm md:col-span-2" />
      </div>
      <button className="mt-4 rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black">Simpan sesi</button>
      {message ? <p className="mt-2 text-xs text-neutral-600">{message}</p> : null}
    </form>
  );
}
