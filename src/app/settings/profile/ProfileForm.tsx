"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { memberCategoryOptions } from "@/lib/member-options";
import { labelForMemberStatus } from "@/lib/registration-options";

type ProfileUser = {
  fullName: string;
  chineseName: string | null;
  phone: string | null;
  email: string;
  homeBranch: { name: string; foThangName: string };
  currentClass: { name: string } | null;
  memberStatus: string;
  memberCategory: string | null;
  userDivisions: Array<{
    division: { name: string; indonesianName: string; chineseName: string };
    subdivision: { name: string; indonesianName: string; chineseName: string } | null;
  }>;
};

function categoryLabel(value: string | null) {
  return memberCategoryOptions.find((item) => item.value === value)?.label || "Belum ditentukan";
}

function divisionText(items: ProfileUser["userDivisions"]) {
  if (!items.length) return "Belum ada divisi";
  return items.map((item) =>
    `${item.division.name}${item.subdivision ? ` / ${item.subdivision.name}` : ""}`,
  ).join(", ");
}

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/profile", { method: "PATCH", body: new FormData(event.currentTarget) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update profil.");
      setMessage("Profil berhasil diperbarui.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form className="surface grid gap-4 rounded-lg p-5 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="text-sm font-medium text-neutral-700">Nama lengkap<input name="fullName" defaultValue={user.fullName} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required /></label>
        <label className="text-sm font-medium text-neutral-700">Nama Mandarin<input name="chineseName" defaultValue={user.chineseName || ""} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" /></label>
        <label className="text-sm font-medium text-neutral-700">Nomor HP<input name="phone" defaultValue={user.phone || ""} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" /></label>
        <label className="text-sm font-medium text-neutral-700">Email<input value={user.email} readOnly className="mt-2 w-full rounded-md border border-neutral-200 bg-[#f5f5f5] px-3 py-2 text-neutral-500" /></label>
        <label className="text-sm font-medium text-neutral-700">Foto profil<input name="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-sm font-medium text-neutral-700">Kartu Qiu Dao<input name="qiuDaoCard" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" /></label>

        <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Cabang / Fo Thang<br /><strong>{user.homeBranch.name} - {user.homeBranch.foThangName}</strong></div>
        <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Status anggota<br /><strong>{labelForMemberStatus(user.memberStatus)}</strong></div>
        <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Kelas<br /><strong>{user.currentClass?.name || "Belum ditentukan"}</strong></div>
        <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Hierarchy<br /><strong>{categoryLabel(user.memberCategory)}</strong></div>
        <div className="rounded-md bg-[#fff7e8] p-3 text-sm md:col-span-2">Divisi<br /><strong>{divisionText(user.userDivisions)}</strong></div>

        <button disabled={saving} className="rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60 md:col-span-2">{saving ? "Menyimpan..." : "Simpan"}</button>
      </form>
    </div>
  );
}
