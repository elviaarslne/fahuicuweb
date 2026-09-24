"use client";

import { useState } from "react";

export function SessionFeedbackForm({ sessionId, title }: { sessionId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(formData: FormData) {
    setMessage("");
    setIsError(false);
    const response = await fetch(`/api/event-sessions/${sessionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        speakerClarityRating: formData.get("speakerClarityRating"),
        materialUsefulnessRating: formData.get("materialUsefulnessRating"),
        topicRelevanceRating: formData.get("topicRelevanceRating"),
        learnedText: formData.get("learnedText"),
        benefitText: formData.get("benefitText"),
        improvementText: formData.get("improvementText"),
      }),
    });
    const data = await response.json();
    setIsError(!response.ok);
    setMessage(!response.ok ? data.error || "Gagal menyimpan feedback topik." : "Feedback topik tersimpan.");
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-left text-sm font-bold text-[#9a6a00]">
        Feedback topik: {title}
      </button>
      {open ? (
        <form action={submit} className="mt-3 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <input name="speakerClarityRating" type="number" min="1" max="5" defaultValue="5" className="rounded-lg border border-black/10 px-3 py-2 text-sm" aria-label="Kejelasan speaker" />
            <input name="materialUsefulnessRating" type="number" min="1" max="5" defaultValue="5" className="rounded-lg border border-black/10 px-3 py-2 text-sm" aria-label="Manfaat materi" />
            <input name="topicRelevanceRating" type="number" min="1" max="5" defaultValue="5" className="rounded-lg border border-black/10 px-3 py-2 text-sm" aria-label="Relevansi topik" />
          </div>
          <textarea name="learnedText" placeholder="Apa yang dipelajari?" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <textarea name="benefitText" placeholder="Apa manfaatnya untuk kamu?" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <textarea name="improvementText" placeholder="Apa yang bisa diperbaiki?" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <button className="w-fit rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black">Simpan feedback</button>
          {message ? <p className={`text-xs font-medium ${isError ? "text-red-600" : "text-emerald-700"}`}>{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

export function EventReflectionForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(formData: FormData) {
    setMessage("");
    setIsError(false);
    const response = await fetch("/api/event-reflections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        overallImpression: formData.get("overallImpression"),
        mainLearning: formData.get("mainLearning"),
        suggestion: formData.get("suggestion"),
      }),
    });
    const data = await response.json();
    setIsError(!response.ok);
    setMessage(!response.ok ? data.error || "Gagal menyimpan refleksi." : "Refleksi event tersimpan.");
  }

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-[#fff7e8] p-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-left text-sm font-bold text-[#9a6a00]">
        Refleksi keseluruhan event
      </button>
      {open ? (
        <form action={submit} className="mt-3 grid gap-3">
          <textarea name="overallImpression" placeholder="Kesan keseluruhan" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <textarea name="mainLearning" placeholder="Pembelajaran utama" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <textarea name="suggestion" placeholder="Saran" className="min-h-20 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <button className="w-fit rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black">Simpan refleksi</button>
          {message ? <p className={`text-xs font-medium ${isError ? "text-red-600" : "text-emerald-700"}`}>{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
