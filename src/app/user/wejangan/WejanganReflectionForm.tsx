"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WejanganReflectionForm({
  wejanganId,
  initialAnswer,
}: {
  wejanganId: string;
  initialAnswer?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/wejangan/${wejanganId}/reflection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: formData.get("answer") }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Gagal menyimpan refleksi.");
        return;
      }
      const creditText = data.creditAwarded ? ` +${data.creditAwarded} credit.` : "";
      setMessage(`Refleksi tersimpan.${creditText}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={submit} className="mt-4 space-y-3">
      <textarea
        name="answer"
        defaultValue={initialAnswer || ""}
        placeholder="Tulis refleksi singkatmu..."
        className="min-h-28 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        disabled={submitting}
      />
      <button
        className="rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Menyimpan..." : "Kirim refleksi"}
      </button>
      {message ? <p className="text-xs font-medium text-neutral-600">{message}</p> : null}
    </form>
  );
}
