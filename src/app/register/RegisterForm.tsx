"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { memberStatusOptions } from "@/lib/registration-options";

async function readError(response: Response) {
  try {
    const data = await response.json();
    return data?.error || "Terjadi kesalahan.";
  } catch {
    return "Terjadi kesalahan.";
  }
}

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; foThangName: string }>>([]);
  const [divisions, setDivisions] = useState<Array<{
    id: string;
    name: string;
    indonesianName: string;
    chineseName: string;
    isPilot: boolean;
    subdivisions: Array<{ id: string; name: string; indonesianName: string; chineseName: string }>;
  }>>([]);
  const [memberStatus, setMemberStatus] = useState("QIU_DAO_BARU");
  const [selectedDivisionIds, setSelectedDivisionIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/branches")
      .then((response) => response.json())
      .then((data) => setBranches(data.branches || []))
      .catch(() => setBranches([]));
    fetch("/api/divisions")
      .then((response) => response.json())
      .then((data) => setDivisions(data.divisions || []))
      .catch(() => setDivisions([]));
  }, []);

  function toggleDivision(divisionId: string, checked: boolean) {
    setSelectedDivisionIds((current) => checked ? [...current, divisionId] : current.filter((id) => id !== divisionId));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (memberStatus === "ANGGOTA_LAMA" && selectedDivisionIds.length === 0) {
        throw new Error("Anggota lama wajib memilih minimal satu divisi.");
      }

      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setMessage("Pendaftaran berhasil dikirim. Menunggu evaluasi admin/ketua.");
      window.setTimeout(() => router.push("/pending"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="rounded-lg border border-[#f4b63f]/40 bg-[#fff7e8] p-4 md:col-span-2">
        <p className="text-sm font-semibold text-[#1f1f1f]">Pilot sistem saat ini: Fa Hui Cu - Seksi Sidang Dharma</p>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          Data divisi dipakai untuk evaluasi pendaftaran. Sistem operasional V1 tetap berjalan khusus untuk Fa Hui Cu.
        </p>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Nama lengkap</span>
        <input name="fullName" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Nama Mandarin (opsional)</span>
        <input name="chineseName" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-neutral-700">Cabang / Fo Thang</span>
        <select name="homeBranchId" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required>
          <option value="">Pilih cabang</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} - {branch.foThangName}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium text-neutral-700">Status anggota</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {memberStatusOptions.map((option) => (
            <label key={option.value} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
              <input
                className="mr-2 accent-[#f4b63f]"
                type="radio"
                name="memberStatus"
                value={option.value}
                checked={memberStatus === option.value}
                onChange={(event) => setMemberStatus(event.target.value)}
              />
              <span className="font-semibold text-[#1f1f1f]">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium text-neutral-700">
          Divisi / seksi {memberStatus === "ANGGOTA_LAMA" ? "(pilih minimal satu)" : "(opsional untuk Qiu Dao baru)"}
        </legend>
        <div className="mt-2 grid gap-3">
          {divisions.map((division) => {
            const selected = selectedDivisionIds.includes(division.id);
            return (
              <div key={division.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    className="mt-1 accent-[#f4b63f]"
                    type="checkbox"
                    name="divisionIds"
                    value={division.id}
                    checked={selected}
                    onChange={(event) => toggleDivision(division.id, event.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-[#1f1f1f]">
                      {division.name} - {division.indonesianName} / {division.chineseName}
                    </span>
                    {division.isPilot ? <span className="ml-2 rounded-full bg-[#ffe7a3] px-2 py-0.5 text-xs font-bold text-[#7a5500]">pilot aktif</span> : null}
                  </span>
                </label>

                {selected && division.subdivisions.length ? (
                  <div className="ml-7 mt-3 grid gap-2 rounded-md bg-[#fff7e8] p-3 sm:grid-cols-2">
                    {division.subdivisions.map((subdivision) => (
                      <label key={subdivision.id} className="text-sm text-neutral-700">
                        <input
                          className="mr-2 accent-[#f4b63f]"
                          type="checkbox"
                          name="subdivisionIds"
                          value={subdivision.id}
                        />
                        {subdivision.name} - {subdivision.indonesianName} / {subdivision.chineseName}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {memberStatus === "ANGGOTA_LAMA" && selectedDivisionIds.length === 0 ? (
          <p className="mt-2 text-xs text-amber-700">Anggota lama wajib memilih minimal satu divisi sebelum submit.</p>
        ) : null}
      </fieldset>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Email</span>
        <input name="email" type="email" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Nomor HP</span>
        <input name="phone" type="tel" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Password</span>
        <input name="password" type="password" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Konfirmasi password</span>
        <input name="confirmPassword" type="password" className="focus-ring mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Foto profil (opsional)</span>
        <input name="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Bukti kartu Qiu Dao</span>
        <input name="qiuDaoCard" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" required />
      </label>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">
          {message}
        </div>
      ) : null}

      <div className="md:col-span-2">
        <button
          className="focus-ring rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-semibold text-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Mengirim..." : "Kirim pendaftaran"}
        </button>
      </div>
    </form>
  );
}
