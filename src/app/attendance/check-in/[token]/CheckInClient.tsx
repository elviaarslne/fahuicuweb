"use client";

import Link from "next/link";
import { useState } from "react";

export default function CheckInClient({ token }: { token: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal check-in.");
      setMessage(data.message || "Check-in berhasil.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal check-in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] px-5 py-10 text-[#1f1f1f]">
      <section className="mx-auto max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Fa Hui Cu Attendance</p>
        <h1 className="mt-3 text-2xl font-bold">QR Check-in</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Tekan tombol di bawah untuk mencatat kehadiran. Jika belum login, silakan login dulu lalu buka ulang link QR ini.
        </p>
        <button
          onClick={checkIn}
          disabled={loading}
          className="mt-5 w-full rounded-md bg-[#f4b63f] px-4 py-3 text-sm font-bold text-[#1f1f1f] disabled:opacity-60"
        >
          {loading ? "Mencatat..." : "Check-in sekarang"}
        </button>
        {message ? <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-[#1f1f1f] underline">
          Login
        </Link>
      </section>
    </main>
  );
}
