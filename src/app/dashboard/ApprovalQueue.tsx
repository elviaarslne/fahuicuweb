"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { getEventRoleLabel } from "@/lib/event-options";

type PendingUser = {
  id: string;
  fullName: string;
  email: string;
  homeBranch?: { name: string; foThangName: string } | null;
  currentClass?: { name: string } | null;
};

type PendingParticipant = {
  id: string;
  role: string;
  user: {
    fullName: string;
    email: string;
    homeBranch?: { name: string; foThangName: string } | null;
    currentClass?: { name: string } | null;
  };
  event: {
    title: string;
    hostingBranch: { name: string; foThangName: string };
    targetClass?: { name: string } | null;
  };
};

export default function ApprovalQueue() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingCrossBranch, setPendingCrossBranch] = useState<PendingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/approvals");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mengambil approval queue.");
      setPendingUsers(data.pendingUsers || []);
      setPendingCrossBranch(data.pendingCrossBranch || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil approval queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function updateUser(userId: string, status: "ACTIVE" | "REJECTED") {
    setSavingId(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update user.");
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update user.");
    } finally {
      setSavingId(null);
    }
  }

  async function updateRegistration(participantId: string, registrationStatus: "APPROVED" | "REJECTED") {
    setSavingId(participantId);
    try {
      const response = await fetch(`/api/event-participants/${participantId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update registrasi.");
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update registrasi.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="surface rounded-lg p-5 text-sm text-neutral-500">Memuat approval queue...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (pendingUsers.length === 0 && pendingCrossBranch.length === 0) {
    return (
      <div className="surface rounded-lg p-5">
        <h2 className="text-lg font-semibold text-[#1f1f1f]">Approval queue</h2>
        <p className="mt-2 text-sm text-neutral-500">Tidak ada approval yang menunggu.</p>
      </div>
    );
  }

  return (
    <section className="surface rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Approval queue</h2>
          <p className="text-sm text-neutral-500">Pendaftar baru dan registrasi lintas cabang.</p>
        </div>
        <StatusBadge value={`${pendingUsers.length + pendingCrossBranch.length} pending`} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="font-semibold text-[#1f1f1f]">Pending users</h3>
          <div className="mt-3 space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id} className="rounded-md bg-[#fff7e8] p-3 text-sm">
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-xs text-neutral-500">{user.email}</p>
                <p className="mt-1 text-xs text-neutral-500">{user.homeBranch?.name || "-"} • {user.currentClass?.name || "Kelas belum ditentukan"}</p>
                <div className="mt-3 flex gap-2">
                  <button disabled={savingId === user.id} onClick={() => updateUser(user.id, "ACTIVE")} className="rounded-md bg-[#f4b63f] px-3 py-1.5 text-xs font-bold text-[#1f1f1f]">Approve</button>
                  <button disabled={savingId === user.id} onClick={() => updateUser(user.id, "REJECTED")} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700">Reject</button>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 ? <p className="text-sm text-neutral-500">Tidak ada pending user.</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="font-semibold text-[#1f1f1f]">Cross-branch registrations</h3>
          <div className="mt-3 space-y-3">
            {pendingCrossBranch.map((item) => (
              <div key={item.id} className="rounded-md bg-[#fff7e8] p-3 text-sm">
                <p className="font-semibold">{item.user.fullName}</p>
                <p className="text-xs text-neutral-500">{item.user.homeBranch?.name || "-"} → {item.event.hostingBranch.name}</p>
                <p className="mt-1 text-xs text-neutral-500">{item.event.title} • {item.event.targetClass?.name || "Semua kelas"} • {getEventRoleLabel(item.role)}</p>
                <div className="mt-3 flex gap-2">
                  <button disabled={savingId === item.id} onClick={() => updateRegistration(item.id, "APPROVED")} className="rounded-md bg-[#f4b63f] px-3 py-1.5 text-xs font-bold text-[#1f1f1f]">Approve</button>
                  <button disabled={savingId === item.id} onClick={() => updateRegistration(item.id, "REJECTED")} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700">Reject</button>
                </div>
              </div>
            ))}
            {pendingCrossBranch.length === 0 ? <p className="text-sm text-neutral-500">Tidak ada registrasi lintas cabang.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
