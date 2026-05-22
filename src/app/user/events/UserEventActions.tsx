"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserEventActions({
  eventId,
  qrToken,
  canCheckIn,
  isRegistered,
  registerLabel = "Daftar acara",
}: {
  eventId: string;
  qrToken: string;
  canCheckIn: boolean;
  isRegistered: boolean;
  registerLabel?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function register() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
    const data = await response.json();
    setBusy(false);
    setMessage(data.message || data.error || "Selesai.");
    if (response.ok) router.refresh();
  }

  async function checkIn() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken }),
    });
    const data = await response.json();
    setBusy(false);
    setMessage(data.message || data.error || "Selesai.");
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {!isRegistered ? (
        <button type="button" onClick={register} disabled={busy} className="rounded-full bg-[#f4c62b] px-4 py-2 text-sm font-bold text-[#1f1f1f] hover:bg-[#e8b923] disabled:opacity-60">
          {busy ? "Memproses..." : registerLabel}
        </button>
      ) : null}
      {canCheckIn ? (
        <button type="button" onClick={checkIn} disabled={busy} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-[#fff7e8] disabled:opacity-60">
          Check-in hari ini
        </button>
      ) : null}
      {message ? <p className="w-full text-xs font-medium text-neutral-600">{message}</p> : null}
    </div>
  );
}
