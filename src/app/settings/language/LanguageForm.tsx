"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { languageOptions, type Locale } from "@/lib/i18n";

export default function LanguageForm({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: formData.get("language") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal simpan bahasa.");
      setMessage("Bahasa disimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal simpan bahasa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form className="surface rounded-lg p-5" onSubmit={onSubmit}>
        <select name="language" defaultValue={currentLocale} className="w-full rounded-md border border-neutral-200 px-3 py-2">
          {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button disabled={saving} className="mt-4 rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan"}</button>
      </form>
    </div>
  );
}
