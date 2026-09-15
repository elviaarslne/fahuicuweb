"use client";

import { useState } from "react";

export default function SecurityForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mengganti password.");
      setMessage("Password berhasil diganti.");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengganti password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form className="surface rounded-lg p-5" onSubmit={onSubmit}>
        <h2 className="text-sm font-semibold text-[#1f1f1f]">Ganti password</h2>
        <div className="mt-4 grid gap-3">
          <input name="currentPassword" type="password" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Password saat ini" required />
          <input name="newPassword" type="password" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Password baru" required />
          <input name="confirmNewPassword" type="password" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Konfirmasi password baru" required />
        </div>
        <button disabled={saving} className="mt-4 rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">{saving ? "Menyimpan..." : "Ganti password"}</button>
      </form>

      <p className="rounded-lg bg-[#fff7e8] p-3 text-sm leading-6 text-neutral-600">
        Catatan refleksi dan jurnal kamu bersifat pribadi. Admin, trainer, dan pengurus tidak dapat membacanya.
      </p>
    </div>
  );
}
