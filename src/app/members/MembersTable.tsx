"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { memberCategoryOptions, statusOptions } from "@/lib/member-options";
import { labelForMemberStatus, memberStatusOptions } from "@/lib/registration-options";

type UserDivisionRow = {
  id: string;
  divisionId: string;
  subdivisionId: string | null;
  division: { id: string; name: string; indonesianName: string; chineseName: string };
  subdivision: { id: string; name: string; indonesianName: string; chineseName: string } | null;
};

type UserRow = {
  id: string;
  fullName: string;
  chineseName: string | null;
  email: string;
  phone: string | null;
  status: string;
  memberStatus: string;
  memberCategory: string | null;
  profilePhotoUrl: string | null;
  qiuDaoCardUrl: string | null;
  currentClassId: string | null;
  homeBranchId: string;
  homeBranch?: { name: string; foThangName: string } | null;
  currentClass?: { name: string } | null;
  systemRoles: { role: string }[];
  userDivisions: UserDivisionRow[];
};

type ClassLevel = { id: string; levelNumber: number; name: string };
type Branch = { id: string; name: string; foThangName: string };
type Division = {
  id: string;
  name: string;
  indonesianName: string;
  chineseName: string;
  isPilot: boolean;
  subdivisions: Array<{ id: string; name: string; indonesianName: string; chineseName: string }>;
};

type UpdatePayload = {
  status?: string;
  memberStatus?: string;
  memberCategory?: string | null;
  currentClassId?: string | null;
  homeBranchId?: string;
  divisionIds?: string[];
  subdivisionIds?: string[];
};

function labelForCategory(value: string | null) {
  return memberCategoryOptions.find((item) => item.value === value)?.label || "-";
}

function selectedDivisionIds(user: UserRow) {
  return [...new Set(user.userDivisions.map((item) => item.divisionId))];
}

function selectedSubdivisionIds(user: UserRow) {
  return user.userDivisions.flatMap((item) => (item.subdivisionId ? [item.subdivisionId] : []));
}

function divisionSummary(user: UserRow) {
  if (user.userDivisions.length === 0) return "Belum ada divisi";
  return selectedDivisionIds(user)
    .map((divisionId) => {
      const rows = user.userDivisions.filter((row) => row.divisionId === divisionId);
      const division = rows[0]?.division;
      const subdivisions = rows.flatMap((row) => (row.subdivision ? [row.subdivision.name] : []));
      return `${division?.name || divisionId}${subdivisions.length ? ` (${subdivisions.join(", ")})` : ""}`;
    })
    .join("; ");
}

export default function MembersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE">("PENDING");
  const [branchFilter, setBranchFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mengambil data user.");
      setUsers(data.users);
      setClassLevels(data.classLevels);
      setBranches(data.branches || []);
      setDivisions(data.divisions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data user.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(userId: string, payload: UpdatePayload) {
    setSavingId(userId);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update user.");
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)));
      if (payload.status === "ACTIVE") setActiveTab("ACTIVE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update user.");
    } finally {
      setSavingId(null);
    }
  }

  function updateDivisionSelection(user: UserRow, nextDivisionIds: string[], nextSubdivisionIds = selectedSubdivisionIds(user)) {
    updateUser(user.id, { divisionIds: nextDivisionIds, subdivisionIds: nextSubdivisionIds });
  }

  function toggleDivision(user: UserRow, divisionId: string, checked: boolean) {
    const current = selectedDivisionIds(user);
    const nextDivisionIds = checked ? [...current, divisionId] : current.filter((id) => id !== divisionId);
    const removedSubdivisionIds = divisions.find((division) => division.id === divisionId)?.subdivisions.map((subdivision) => subdivision.id) || [];
    const nextSubdivisionIds = selectedSubdivisionIds(user).filter((id) => checked || !removedSubdivisionIds.includes(id));
    updateDivisionSelection(user, nextDivisionIds, nextSubdivisionIds);
  }

  function toggleSubdivision(user: UserRow, divisionId: string, subdivisionId: string, checked: boolean) {
    const currentDivisions = selectedDivisionIds(user);
    const currentSubdivisions = selectedSubdivisionIds(user);
    const nextDivisionIds = currentDivisions.includes(divisionId) ? currentDivisions : [...currentDivisions, divisionId];
    const nextSubdivisionIds = checked
      ? [...currentSubdivisions, subdivisionId]
      : currentSubdivisions.filter((id) => id !== subdivisionId);
    updateDivisionSelection(user, nextDivisionIds, nextSubdivisionIds);
  }

  const pendingUsers = useMemo(() => users.filter((user) => user.status === "PENDING"), [users]);
  const activeUsers = useMemo(() => {
    return users.filter((user) => {
      if (user.status !== "ACTIVE") return false;
      if (branchFilter && user.homeBranchId !== branchFilter) return false;
      if (classFilter && user.currentClassId !== classFilter) return false;
      if (divisionFilter && !user.userDivisions.some((item) => item.divisionId === divisionFilter)) return false;
      return true;
    });
  }, [branchFilter, classFilter, divisionFilter, users]);
  const rows = activeTab === "PENDING" ? pendingUsers : activeUsers;

  if (loading) {
    return <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Memuat data pendaftar...</div>;
  }

  if (error) {
    return <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full px-4 py-2 text-sm font-bold ${activeTab === "PENDING" ? "bg-[#f4b63f] text-[#1f1f1f]" : "bg-white text-neutral-600"}`}
          onClick={() => setActiveTab("PENDING")}
          type="button"
        >
          Pending ({pendingUsers.length})
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-bold ${activeTab === "ACTIVE" ? "bg-[#f4b63f] text-[#1f1f1f]" : "bg-white text-neutral-600"}`}
          onClick={() => setActiveTab("ACTIVE")}
          type="button"
        >
          Active ({users.filter((user) => user.status === "ACTIVE").length})
        </button>
      </div>

      {activeTab === "ACTIVE" ? (
        <div className="grid gap-3 rounded-lg border border-neutral-200 bg-[#fff7e8] p-4 md:grid-cols-3">
          <select className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
            <option value="">Semua cabang</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
            <option value="">Semua kelas</option>
            {classLevels.map((classLevel) => <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>)}
          </select>
          <select className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm" value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)}>
            <option value="">Semua divisi</option>
            {divisions.map((division) => <option key={division.id} value={division.id}>{division.name} - {division.chineseName}</option>)}
          </select>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[1450px] border-collapse text-left text-sm">
          <thead className="bg-[#fff7e8] text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3">Cabang</th>
              <th className="px-4 py-3">Status anggota</th>
              <th className="px-4 py-3">Divisi & sub-divisi</th>
              <th className="px-4 py-3">Status approval</th>
              <th className="px-4 py-3">Kategori anggota</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Berkas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {rows.map((user) => {
              const userDivisionIds = selectedDivisionIds(user);
              const userSubdivisionIds = selectedSubdivisionIds(user);
              return (
                <tr key={user.id} className={savingId === user.id ? "opacity-60" : ""}>
                  <td className="px-4 py-3 align-top">
                    <Link className="font-semibold text-neutral-900 underline" href={`/members/${user.id}`}>{user.fullName}</Link>
                    <p className="text-xs text-neutral-500">{user.chineseName || "-"}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-neutral-600">
                    <p>{user.email}</p>
                    <p className="text-xs">{user.phone || "Nomor HP kosong"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2" value={user.homeBranchId} onChange={(event) => updateUser(user.id, { homeBranchId: event.target.value })}>
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">{user.homeBranch?.foThangName || "-"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2" value={user.memberStatus || "QIU_DAO_BARU"} onChange={(event) => updateUser(user.id, { memberStatus: event.target.value })}>
                      {memberStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">{labelForMemberStatus(user.memberStatus)}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-h-64 w-[360px] overflow-y-auto rounded-md border border-neutral-200 bg-[#f5f5f5] p-3">
                      <p className="mb-2 text-xs leading-5 text-neutral-500">{divisionSummary(user)}</p>
                      <div className="space-y-3">
                        {divisions.map((division) => (
                          <div key={division.id} className="rounded-md bg-white p-2">
                            <label className="flex items-start gap-2 text-xs font-semibold text-[#1f1f1f]">
                              <input className="mt-0.5 accent-[#f4b63f]" type="checkbox" checked={userDivisionIds.includes(division.id)} onChange={(event) => toggleDivision(user, division.id, event.target.checked)} />
                              <span>{division.name} / {division.chineseName}</span>
                            </label>
                            {userDivisionIds.includes(division.id) && division.subdivisions.length ? (
                              <div className="mt-2 grid gap-1 pl-5">
                                {division.subdivisions.map((subdivision) => (
                                  <label key={subdivision.id} className="text-xs text-neutral-600">
                                    <input className="mr-2 accent-[#f4b63f]" type="checkbox" checked={userSubdivisionIds.includes(subdivision.id)} onChange={(event) => toggleSubdivision(user, division.id, subdivision.id, event.target.checked)} />
                                    {subdivision.name} - {subdivision.indonesianName}
                                  </label>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-2">
                      <StatusBadge value={user.status === "PENDING" ? "Pending" : user.status === "ACTIVE" ? "Active" : user.status} />
                      <select className="block w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs" value={user.status} onChange={(event) => updateUser(user.id, { status: event.target.value })}>
                        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2" value={user.memberCategory || ""} onChange={(event) => updateUser(user.id, { memberCategory: event.target.value || null })}>
                      <option value="">Belum ditentukan</option>
                      {memberCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">{labelForCategory(user.memberCategory)}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2" value={user.currentClassId || ""} onChange={(event) => updateUser(user.id, { currentClassId: event.target.value || null })}>
                      <option value="">Belum ditentukan</option>
                      {classLevels.map((classLevel) => <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <div className="space-y-1">
                      {user.profilePhotoUrl ? <a className="font-semibold underline" href={user.profilePhotoUrl} target="_blank">Foto profil</a> : <span className="text-neutral-400">Foto profil opsional</span>}
                      <br />
                      {user.qiuDaoCardUrl ? <a className="font-semibold underline" href={user.qiuDaoCardUrl} target="_blank">Kartu Qiu Dao</a> : <span className="text-red-600">Kartu belum ada</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-neutral-500" colSpan={9}>
                  Tidak ada user pada section ini.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
