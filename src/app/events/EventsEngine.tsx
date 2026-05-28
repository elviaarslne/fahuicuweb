"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { eventStatusOptions, getEventStatusLabel, getNextEventStatus, speakerCategoryOptions } from "@/lib/event-options";

type EventRow = {
  id: string;
  hostingBranchId: string;
  title: string;
  category: string;
  purpose: string;
  expectedOutcome: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  targetClassId: string | null;
  status: string;
  minimumParticipants: number;
  minimumAge: number | null;
  maximumAge: number | null;
  isConfirmed: boolean;
  qrToken: string;
  hostingBranch?: { name: string; foThangName: string } | null;
  targetClass?: { name: string } | null;
  participants: Array<{
    id: string;
    role: string;
    registrationStatus: string;
    speakerCategory: string | null;
    attendanceStatus: string;
    user: { id: string; fullName: string; chineseName: string | null };
  }>;
  _count: { participants: number; feedbacks: number; materials: number };
};

type UserOption = {
  id: string;
  fullName: string;
  chineseName: string | null;
  memberCategory: string | null;
  isCoordinatorEligible: boolean;
  homeBranchId: string;
  birthDate: string | null;
};

type ClassLevel = {
  id: string;
  levelNumber: number;
  name: string;
};

type Branch = {
  id: string;
  name: string;
  foThangName: string;
};

type EventPanel = "overview" | "create" | "edit" | "participants";

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalInputValueFromString(value: string | null) {
  return value ? toLocalInputValue(new Date(value)) : "";
}

const sidangDharmaRoleOptions = [
  { value: "COORDINATOR", label: "Koordinator" },
  { value: "MC", label: "MC" },
  { value: "SPEAKER", label: "Speaker / Penceramah" },
];

function eventRoleLabel(value: string) {
  return sidangDharmaRoleOptions.find((item) => item.value === value)?.label || value;
}

export default function EventsEngine() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<EventPanel>("overview");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0],
    [events, selectedEventId],
  );

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/events?domain=dharma");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mengambil data Sidang Dharma.");
      setEvents(data.events);
      setUsers(data.users);
      setClassLevels(data.classLevels);
      setBranches(data.branches || []);
      setSelectedEventId((current) => current || data.events[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data Sidang Dharma.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function createEvent(formData: FormData) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostingBranchId: formData.get("hostingBranchId"),
          title: formData.get("title"),
          category: formData.get("category"),
          purpose: formData.get("purpose"),
          expectedOutcome: formData.get("expectedOutcome"),
          description: formData.get("description"),
          location: formData.get("location"),
          startAt: formData.get("startAt"),
          endAt: formData.get("endAt"),
          targetClassId: formData.get("targetClassId") || null,
          minimumParticipants: Number(formData.get("minimumParticipants") || 0),
          minimumAge: formData.get("minimumAge") ? Number(formData.get("minimumAge")) : null,
          maximumAge: formData.get("maximumAge") ? Number(formData.get("maximumAge")) : null,
          isConfirmed: formData.get("isConfirmed") === "on",
          status: "DRAFT",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal membuat Sidang Dharma.");
      setMessage("Sidang Dharma berhasil dibuat sebagai Draft.");
      await loadEvents();
      setSelectedEventId(data.event.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat Sidang Dharma.");
    } finally {
      setSaving(false);
    }
  }

  async function updateEventInfo(formData: FormData) {
    if (!selectedEvent) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          category: formData.get("category"),
          purpose: formData.get("purpose"),
          expectedOutcome: formData.get("expectedOutcome"),
          description: formData.get("description") || null,
          location: formData.get("location") || null,
          startAt: formData.get("startAt"),
          endAt: formData.get("endAt") || null,
          targetClassId: formData.get("targetClassId") || null,
          minimumParticipants: Number(formData.get("minimumParticipants") || 0),
          minimumAge: formData.get("minimumAge") ? Number(formData.get("minimumAge")) : null,
          maximumAge: formData.get("maximumAge") ? Number(formData.get("maximumAge")) : null,
          isConfirmed: formData.get("isConfirmed") === "on",
          hostingBranchId: formData.get("hostingBranchId") || selectedEvent.hostingBranchId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal update Sidang Dharma.");
      setMessage("Info Sidang Dharma berhasil diperbarui.");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update Sidang Dharma.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm("Hapus Sidang Dharma ini? Data participant, sesi, dan attendance terkait akan ikut terhapus.")) return;
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || "Gagal menghapus Sidang Dharma.");
      return;
    }
    setEvents((current) => current.filter((event) => event.id !== eventId));
    setSelectedEventId((current) => (current === eventId ? "" : current));
    setMessage("Sidang Dharma berhasil dihapus.");
  }

  async function advanceEventStatus(eventId: string, currentStatus: string) {
    const nextStatus = getNextEventStatus(currentStatus);
    if (!nextStatus) return;
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || "Gagal update lifecycle Sidang Dharma.");
      return;
    }
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, status: nextStatus } : event)));
    setMessage(`Lifecycle Sidang Dharma lanjut ke ${getEventStatusLabel(nextStatus)}.`);
  }

  async function addParticipant(formData: FormData) {
    if (!selectedEvent) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formData.get("userId"),
          role: formData.get("role"),
          speakerCategory: formData.get("speakerCategory") || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal menambah participant.");
      setMessage("Participant role berhasil ditambahkan.");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah participant.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Memuat perencanaan Sidang Dharma...</div>;
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="surface flex flex-wrap gap-2 rounded-lg p-2">
        {[
          { id: "overview", label: "Daftar Sidang Dharma" },
          { id: "create", label: "Buat Sidang Dharma" },
          { id: "edit", label: "Edit Info" },
          { id: "participants", label: "Role Sidang Dharma" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id as EventPanel)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              activePanel === item.id ? "bg-[#f4b63f] text-[#1f1f1f]" : "bg-white text-neutral-600 hover:bg-[#fff7e8]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {activePanel === "create" ? (
      <section className="surface rounded-lg p-5">
        <h2 className="text-lg font-semibold text-[#1f1f1f]">Buat Draft Sidang Dharma</h2>
        <p className="mt-1 text-sm text-neutral-500">Draft dipakai untuk menyiapkan info dasar, assignment, dan topic sebelum dipublish ke user end.</p>
        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            createEvent(new FormData(event.currentTarget));
          }}
        >
          <fieldset className="rounded-lg border border-neutral-200 bg-white p-4">
            <legend className="px-1 text-sm font-bold text-[#1f1f1f]">Basic info</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input name="title" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Judul Sidang Dharma" required />
              <input name="category" type="hidden" value="SIDANG_DHARMA" />
              <div className="rounded-md border border-neutral-200 bg-[#fff7e8] px-3 py-2 text-sm font-semibold text-neutral-700">Sidang Dharma</div>
              <textarea name="description" className="min-h-20 rounded-md border border-neutral-200 px-3 py-2 md:col-span-2" placeholder="Deskripsi opsional" />
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-neutral-200 bg-white p-4">
            <legend className="px-1 text-sm font-bold text-[#1f1f1f]">Branch, class, target</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <select name="hostingBranchId" className="rounded-md border border-neutral-200 px-3 py-2" required>
                <option value="">Pilih cabang Sidang Dharma</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name} - {branch.foThangName}</option>
                ))}
              </select>
              <select name="targetClassId" className="rounded-md border border-neutral-200 px-3 py-2">
                <option value="">Target semua kelas / opsional</option>
                {classLevels.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <input name="minimumParticipants" type="number" min="0" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Minimum peserta" />
              <input name="minimumAge" type="number" min="0" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Minimum umur" />
              <input name="maximumAge" type="number" min="0" className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Maximum umur" />
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-neutral-200 bg-white p-4">
            <legend className="px-1 text-sm font-bold text-[#1f1f1f]">Schedule & location</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-neutral-600">Start<input name="startAt" type="datetime-local" defaultValue={toLocalInputValue(new Date())} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2" required /></label>
              <label className="text-sm text-neutral-600">End<input name="endAt" type="datetime-local" className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2" /></label>
              <input name="location" className="self-end rounded-md border border-neutral-200 px-3 py-2" placeholder="Lokasi" />
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-neutral-200 bg-white p-4">
            <legend className="px-1 text-sm font-bold text-[#1f1f1f]">Purpose & outcome</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <textarea name="purpose" className="min-h-24 rounded-md border border-neutral-200 px-3 py-2" placeholder="Tujuan acara" required />
              <textarea name="expectedOutcome" className="min-h-24 rounded-md border border-neutral-200 px-3 py-2" placeholder="Expected outcome" required />
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input name="isConfirmed" type="checkbox" className="size-4" />
            Sidang Dharma sudah dikonfirmasi
          </label>
          <button disabled={saving} className="rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">
            {saving ? "Menyimpan..." : "Buat Draft Sidang Dharma"}
          </button>
        </form>
      </section>
      ) : null}

      {activePanel === "overview" ? (
      <section className="space-y-6">
        <div className="surface rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Workflow Sidang Dharma</h2>
          <p className="mt-1 text-sm text-neutral-500">Draft tidak tampil di user end. Setelah publish, registration, attendance, feedback, dan archive mengikuti lifecycle Sidang Dharma.</p>
          <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              {eventStatusOptions.map((item, index) => (
                <div key={item.value} className="flex items-center gap-2">
                  <div className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold text-neutral-700">
                    {item.label}
                  </div>
                  {index < eventStatusOptions.length - 1 ? <span className="text-neutral-300">→</span> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {events.length === 0 ? (
            <div className="surface rounded-lg p-5 text-sm text-neutral-600">
              Belum ada Sidang Dharma. Buat draft pertama dari tab Buat Sidang Dharma.
            </div>
          ) : null}
          {events.map((event) => (
            <article key={event.id} className="surface rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button className="text-left" onClick={() => setSelectedEventId(event.id)}>
                  <p className="text-base font-bold text-[#1f1f1f]">{event.title}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {event.hostingBranch?.name || "PUSAT"} • {event.category} • {new Date(event.startAt).toLocaleString("id-ID")} • {event.targetClass?.name || "Semua kelas"}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{event.purpose}</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">Expected: {event.expectedOutcome}</p>
                </button>
                <div className="space-y-2 text-right">
                  <StatusBadge value={event.status} />
                  <Link
                    className="block rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-[#fff7e8]"
                    href={`/events/${event.id}`}
                  >
                    Detail Sidang Dharma
                  </Link>
                  {getNextEventStatus(event.status) ? (
                    <button
                      className="block rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-[#fff7e8]"
                      onClick={() => advanceEventStatus(event.id, event.status)}
                    >
                      Lanjut ke {getEventStatusLabel(getNextEventStatus(event.status) || "")}
                    </button>
                  ) : (
                    <p className="text-xs text-neutral-400">Lifecycle selesai</p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className={`rounded-md p-3 text-sm ${event.minimumParticipants > 0 && event._count.participants < event.minimumParticipants ? "bg-amber-50 text-amber-800" : "bg-[#fff7e8]"}`}>Peserta: <strong>{event._count.participants}/{event.minimumParticipants || "-"}</strong></div>
                <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Age: <strong>{event.minimumAge ?? "-"} - {event.maximumAge ?? "-"}</strong></div>
                <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Registration: <strong>{event.status === "REGISTRATION_OPEN" ? "Open" : "Closed"}</strong></div>
                <div className="rounded-md bg-[#fff7e8] p-3 text-sm">QR: <strong>{["REGISTRATION_OPEN", "ONGOING"].includes(event.status) ? "Active" : "Inactive"}</strong></div>
                <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Feedback: <strong>{event.status === "FEEDBACK_COLLECTION" ? "Open" : `${event._count.feedbacks} masuk`}</strong></div>
                <div className="rounded-md bg-[#fff7e8] p-3 text-sm">Confirmed: <strong>{event.isConfirmed ? "Yes" : "No"}</strong></div>
                <div className="rounded-md bg-[#f5f5f5] p-3 text-sm">Materials: <strong>{event._count.materials}</strong></div>
                <div className="rounded-md bg-[#fff7e8] p-3 text-xs md:col-span-2">QR token: <strong>{event.qrToken}</strong></div>
              </div>
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Participant Sidang Dharma</p>
                {event.participants.length === 0 ? (
                  <p className="mt-2 text-sm text-neutral-500">Belum ada role Sidang Dharma.</p>
                ) : (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {event.participants.map((participant) => (
                      <div key={participant.id} className="rounded-md bg-[#fff7e8] px-3 py-2 text-sm">
                        <strong>{participant.user.chineseName || participant.user.fullName}</strong>
                        <span className="text-neutral-500"> • {eventRoleLabel(participant.role)}</span>
                        <span className="text-neutral-500"> • {participant.registrationStatus}</span>
                        {participant.speakerCategory ? <span className="text-neutral-500"> • {participant.speakerCategory}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activePanel === "edit" ? (
      <section className="surface rounded-lg p-5 xl:col-span-2">
        <div className="mb-6 rounded-lg border border-[#f4b63f]/30 bg-[#fff7e8] p-4">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Edit info Sidang Dharma</h2>
          <p className="mt-1 text-sm text-neutral-500">Pilih Sidang Dharma dari daftar, lalu update detail operasionalnya.</p>
          <select className="mt-4 w-full rounded-md border border-neutral-200 px-3 py-2" value={selectedEvent?.id || ""} onChange={(event) => setSelectedEventId(event.target.value)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
          {selectedEvent ? (
            <form
              key={selectedEvent.id}
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                updateEventInfo(new FormData(event.currentTarget));
              }}
            >
              <input name="title" defaultValue={selectedEvent.title} className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Judul Sidang Dharma" required />
              <select name="hostingBranchId" defaultValue={selectedEvent.hostingBranchId} className="rounded-md border border-neutral-200 px-3 py-2" required>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.foThangName}
                  </option>
                ))}
              </select>
              <input name="category" type="hidden" defaultValue="SIDANG_DHARMA" />
              <div className="rounded-md border border-neutral-200 bg-[#fff7e8] px-3 py-2 text-sm font-semibold text-neutral-700">Sidang Dharma</div>
              <textarea name="purpose" defaultValue={selectedEvent.purpose} className="min-h-20 rounded-md border border-neutral-200 px-3 py-2 md:col-span-2" placeholder="Tujuan acara" required />
              <textarea name="expectedOutcome" defaultValue={selectedEvent.expectedOutcome} className="min-h-20 rounded-md border border-neutral-200 px-3 py-2 md:col-span-2" placeholder="Expected outcome" required />
              <textarea name="description" defaultValue={selectedEvent.description || ""} className="min-h-20 rounded-md border border-neutral-200 px-3 py-2 md:col-span-2" placeholder="Deskripsi opsional" />
              <input name="location" defaultValue={selectedEvent.location || ""} className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Lokasi" />
              <input name="minimumParticipants" type="number" min="0" defaultValue={selectedEvent.minimumParticipants || 0} className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Minimum peserta" />
              <input name="minimumAge" type="number" min="0" defaultValue={selectedEvent.minimumAge ?? ""} className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Minimum umur" />
              <input name="maximumAge" type="number" min="0" defaultValue={selectedEvent.maximumAge ?? ""} className="rounded-md border border-neutral-200 px-3 py-2" placeholder="Maximum umur" />
              <select name="targetClassId" defaultValue={selectedEvent.targetClassId || ""} className="rounded-md border border-neutral-200 px-3 py-2">
                <option value="">Target semua kelas / opsional</option>
                {classLevels.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <label className="text-sm text-neutral-600">
                Start
                <input name="startAt" type="datetime-local" defaultValue={toLocalInputValueFromString(selectedEvent.startAt)} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2" required />
              </label>
              <label className="text-sm text-neutral-600">
                End
                <input name="endAt" type="datetime-local" defaultValue={toLocalInputValueFromString(selectedEvent.endAt)} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2" />
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-600 md:col-span-2">
                <input name="isConfirmed" type="checkbox" defaultChecked={selectedEvent.isConfirmed} className="size-4" />
                Sidang Dharma sudah dikonfirmasi
              </label>
              <button disabled={saving} className="rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">
                Simpan perubahan Sidang Dharma
              </button>
              <button type="button" onClick={() => deleteEvent(selectedEvent.id)} className="rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
                Delete Sidang Dharma
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">Belum ada Sidang Dharma yang bisa diedit.</p>
          )}
        </div>
      </section>
      ) : null}

      {activePanel === "participants" ? (
      <section className="surface rounded-lg p-5">
        <h2 className="text-lg font-semibold text-[#1f1f1f]">Assign role Sidang Dharma</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Satu user bisa punya role berbeda di Sidang Dharma berbeda. Ini menjadi dasar operasional, absensi, feedback, dan credit.
        </p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            addParticipant(new FormData(event.currentTarget));
          }}
        >
          <select className="rounded-md border border-neutral-200 px-3 py-2" value={selectedEvent?.id || ""} onChange={(event) => setSelectedEventId(event.target.value)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
          <select name="userId" className="rounded-md border border-neutral-200 px-3 py-2" required>
            <option value="">Pilih user aktif</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.chineseName || user.fullName}{user.isCoordinatorEligible ? " • coordinator eligible" : ""}
              </option>
            ))}
          </select>
          <select name="role" className="rounded-md border border-neutral-200 px-3 py-2" required>
            {sidangDharmaRoleOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select name="speakerCategory" className="rounded-md border border-neutral-200 px-3 py-2">
            <option value="">Speaker category jika role Speaker</option>
            {speakerCategoryOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button disabled={saving || !selectedEvent} className="rounded-md bg-[#1f1f1f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 md:col-span-4">
            Tambahkan ke Sidang Dharma
          </button>
        </form>
      </section>
      ) : null}
    </div>
  );
}
