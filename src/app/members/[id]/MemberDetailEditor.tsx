"use client";

import { useState } from "react";
import { memberCategoryOptions, statusOptions } from "@/lib/member-options";
import { memberStatusOptions } from "@/lib/registration-options";

type Props = {
  userId: string;
  defaultValues: {
    status: string;
    memberStatus: string;
    memberCategory: string | null;
    homeBranchId: string;
    currentClassId: string | null;
  };
  branches: Array<{ id: string; name: string; foThangName: string }>;
  classLevels: Array<{ id: string; name: string }>;
};

export default function MemberDetailEditor({ userId, defaultValues, branches, classLevels }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status: formData.get("status"),
          memberStatus: formData.get("memberStatus"),
          memberCategory: formData.get("memberCategory") || null,
          homeBranchId: formData.get("homeBranchId"),
          currentClassId: formData.get("currentClassId") || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update anggota.");
      setMessage("Profil anggota berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update anggota.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-neutral-200 bg-[#fff7e8] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
      }}
    >
      <h2 className="font-semibold text-[#1f1f1f]">Edit data anggota</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select name="status" defaultValue={defaultValues.status} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select name="memberStatus" defaultValue={defaultValues.memberStatus} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
          {memberStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select name="homeBranchId" defaultValue={defaultValues.homeBranchId} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
          {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} - {branch.foThangName}</option>)}
        </select>
        <select name="currentClassId" defaultValue={defaultValues.currentClassId || ""} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
          <option value="">Belum ditentukan</option>
          {classLevels.map((classLevel) => <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>)}
        </select>
        <select name="memberCategory" defaultValue={defaultValues.memberCategory || ""} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm md:col-span-2">
          <option value="">Belum ditentukan</option>
          {memberCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <button disabled={saving} className="mt-4 rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">
        {saving ? "Menyimpan..." : "Simpan perubahan"}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
