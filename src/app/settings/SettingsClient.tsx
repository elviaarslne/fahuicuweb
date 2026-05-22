"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { languageOptions, type Locale } from "@/lib/i18n";
import { memberCategoryOptions } from "@/lib/member-options";
import { labelForMemberStatus } from "@/lib/registration-options";
import { workspaceOptions, type Workspace } from "@/lib/workspace";

type SettingsLabels = {
  profile: string;
  languageAppearance: string;
  privacySecurity: string;
  workspace: string;
  learningActivity: string;
};

type SettingsUser = {
  id: string;
  fullName: string;
  chineseName: string | null;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  qiuDaoCardUrl: string | null;
  homeBranch: { name: string; foThangName: string };
  currentClass: { name: string } | null;
  memberStatus: string;
  memberCategory: string | null;
  creditBalance: number;
  language: Locale;
  journalVisibility: string;
  userDivisions: Array<{
    division: { name: string; indonesianName: string; chineseName: string };
    subdivision: { name: string; indonesianName: string; chineseName: string } | null;
  }>;
};

function categoryLabel(value: string | null) {
  return memberCategoryOptions.find((item) => item.value === value)?.label || "Belum ditentukan";
}

function divisionText(items: SettingsUser["userDivisions"]) {
  if (!items.length) return "Belum ada divisi";
  return items.map((item) =>
    `${item.division.name}${item.subdivision ? ` / ${item.subdivision.name}` : ""}`,
  ).join(", ");
}

export default function SettingsClient({
  user,
  workspaces,
  activeWorkspace,
  joinedEventsCount,
  feedbackSubmittedCount,
  labels,
}: {
  user: SettingsUser;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  joinedEventsCount: number;
  feedbackSubmittedCount: number;
  labels: SettingsLabels;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitProfile(formData: FormData) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/profile", { method: "PATCH", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update profile.");
      setMessage("Profile berhasil diperbarui.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function submitLanguage(formData: FormData) {
    const response = await fetch("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: formData.get("language") }),
    });
    if (response.ok) {
      setMessage("Preferensi bahasa disimpan.");
      router.refresh();
    } else {
      const data = await response.json();
      setError(data?.error || "Gagal simpan bahasa.");
    }
  }

  async function submitPassword(formData: FormData) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || "Gagal mengganti password.");
      return;
    }
    setMessage("Password berhasil diganti.");
  }

  async function switchWorkspace(workspace: Workspace) {
    const response = await fetch("/api/settings/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || "Gagal switch workspace.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mt-5 grid gap-5">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="surface rounded-lg p-5">
        <h2 className="text-lg font-semibold text-[#1f1f1f]">{labels.profile}</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); submitProfile(new FormData(event.currentTarget)); }}>
          <label className="text-sm font-medium text-neutral-700">Full name<input name="fullName" defaultValue={user.fullName} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required /></label>
          <label className="text-sm font-medium text-neutral-700">Chinese name<input name="chineseName" defaultValue={user.chineseName || ""} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-neutral-700">Phone<input name="phone" defaultValue={user.phone || ""} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" /></label>
          <label className="text-sm font-medium text-neutral-700">Email<input value={user.email} readOnly className="mt-2 w-full rounded-md border border-neutral-200 bg-[#f5f5f5] px-3 py-2 text-neutral-500" /></label>
          <label className="text-sm font-medium text-neutral-700">Profile photo<input name="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" /></label>
          <label className="text-sm font-medium text-neutral-700">Qiu Dao card<input name="qiuDaoCard" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" /></label>
          <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Home branch<br /><strong>{user.homeBranch.name} - {user.homeBranch.foThangName}</strong></div>
          <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Member status<br /><strong>{labelForMemberStatus(user.memberStatus)}</strong></div>
          <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Class level<br /><strong>{user.currentClass?.name || "Belum ditentukan"}</strong></div>
          <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Hierarchy<br /><strong>{categoryLabel(user.memberCategory)}</strong></div>
          <div className="rounded-md bg-[#fff7e8] p-3 text-sm md:col-span-2">Division/subdivision<br /><strong>{divisionText(user.userDivisions)}</strong></div>
          <button disabled={saving} className="rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60 md:col-span-2">{saving ? "Menyimpan..." : "Simpan profile"}</button>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <form className="surface rounded-lg p-5" onSubmit={(event) => { event.preventDefault(); submitLanguage(new FormData(event.currentTarget)); }}>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">{labels.languageAppearance}</h2>
          <select name="language" defaultValue={user.language} className="mt-4 w-full rounded-md border border-neutral-200 px-3 py-2">
            {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="mt-3 text-sm leading-6 text-neutral-500">Untuk sekarang, settings dan label navigasi utama mulai mendukung terjemahan bertahap.</p>
          <button className="mt-4 rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f]">Simpan bahasa</button>
        </form>

        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">{labels.workspace}</h2>
          <div className="mt-4 grid gap-2">
            {workspaceOptions.filter((item) => workspaces.includes(item.value)).map((item) => (
              <button key={item.value} className={`rounded-md border px-3 py-2 text-left text-sm ${activeWorkspace === item.value ? "border-[#f4b63f] bg-[#fff7e8]" : "border-neutral-200 bg-white"}`} onClick={() => switchWorkspace(item.value)} type="button">
                <strong>{item.label}</strong>
                <span className="block text-xs text-neutral-500">{item.description}</span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <form className="surface rounded-lg p-5" onSubmit={(event) => { event.preventDefault(); submitPassword(new FormData(event.currentTarget)); }}>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">{labels.privacySecurity}</h2>
          <div className="mt-4 grid gap-3">
            <input name="currentPassword" type="password" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Current password" required />
            <input name="newPassword" type="password" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="New password" required />
            <input name="confirmNewPassword" type="password" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Confirm new password" required />
          </div>
          <p className="mt-4 rounded-md bg-[#fff7e8] p-3 text-sm leading-6 text-neutral-600">
            Catatan refleksi dan journaling bersifat pribadi dan tidak dapat dilihat oleh admin, trainer, maupun pengurus.
            Visibility: <strong>{user.journalVisibility}</strong>.
          </p>
          <button className="mt-4 rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f]">Ganti password</button>
        </form>

        <section className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">{labels.learningActivity}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Global credit<br /><strong>{user.creditBalance}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Current class<br /><strong>{user.currentClass?.name || "-"}</strong></div>
            <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Joined events<br /><strong>{joinedEventsCount}</strong></div>
            <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Feedback submitted<br /><strong>{feedbackSubmittedCount}</strong></div>
          </div>
          <p className="mt-4 rounded-md border border-dashed border-[#f4b63f] bg-white p-3 text-sm text-neutral-600">
            Daily reflection task: coming soon. Nantinya bisa memberi point jika submitted, tetapi isi jurnal tetap private.
          </p>
        </section>
      </section>
    </div>
  );
}
