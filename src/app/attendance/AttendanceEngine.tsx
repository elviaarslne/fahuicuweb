"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, QrCode, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import StatusBadge from "@/components/StatusBadge";
import { attendanceStatusOptions, getAttendanceStatusLabel, getEventStatusLabel } from "@/lib/event-options";

type AttendanceRow = {
  id: string;
  status: string;
  source: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  user: {
    fullName: string;
    chineseName: string | null;
  };
};

type ParticipantRow = {
  id: string;
  role: string;
  userId: string;
  user: {
    fullName: string;
    chineseName: string | null;
  };
};

type AttendanceEvent = {
  id: string;
  title: string;
  category: string;
  status: string;
  startAt: string;
  endAt: string | null;
  qrToken: string;
  location: string | null;
  targetClass?: { name: string } | null;
  participants: ParticipantRow[];
  attendances: AttendanceRow[];
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}

function personName(row: { fullName: string; chineseName: string | null }) {
  return row.chineseName || row.fullName;
}

export default function AttendanceEngine() {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0],
    [events, selectedEventId],
  );

  const checkInUrl =
    typeof window !== "undefined" && selectedEvent
      ? `${window.location.origin}/attendance/check-in/${selectedEvent.qrToken}`
      : "";
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!checkInUrl) return;
    let cancelled = false;
    QRCode.toDataURL(checkInUrl, { margin: 1, width: 192 })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [checkInUrl]);

  async function loadAttendance() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/attendance");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mengambil attendance.");
      setEvents(data.events);
      setSelectedEventId((current) => current || data.events[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  async function copyLink() {
    if (!checkInUrl) return;
    await navigator.clipboard.writeText(checkInUrl);
    setMessage("Link QR check-in disalin.");
  }

  async function manualUpdate(attendanceId: string, status: string) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: "Koreksi manual admin/ketua." }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal koreksi attendance.");
      setMessage("Attendance berhasil dikoreksi.");
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal koreksi attendance.");
    } finally {
      setSaving(false);
    }
  }

  const totalRegistered = selectedEvent ? new Set(selectedEvent.participants.map((participant) => participant.userId)).size : 0;
  const totalPresent = selectedEvent?.attendances.filter((row) => ["PRESENT", "LATE"].includes(row.status)).length || 0;
  const rate = totalRegistered ? Math.round((totalPresent / totalRegistered) * 100) : 0;

  if (loading) {
    return <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Memuat attendance engine...</div>;
  }

  return (
    <div className="mt-5 grid max-w-3xl grid-cols-1 gap-5">
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="surface rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Pilih event</h2>
          <button onClick={loadAttendance} className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-semibold">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        <select
          className="mt-4 w-full rounded-md border border-neutral-200 px-3 py-2"
          value={selectedEvent?.id || ""}
          onChange={(event) => setSelectedEventId(event.target.value)}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
      </div>

      {!selectedEvent ? (
        <div className="surface rounded-lg p-5 text-sm text-neutral-500">Belum ada event untuk attendance.</div>
      ) : (
        <>
          <div className="surface rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">{selectedEvent.category} • {formatDate(selectedEvent.startAt)}</p>
                <h2 className="mt-1 text-xl font-bold text-[#1f1f1f]">{selectedEvent.title}</h2>
                <p className="mt-1 text-sm text-neutral-500">{selectedEvent.location || "Lokasi belum diisi"} • {selectedEvent.targetClass?.name || "Semua kelas"}</p>
              </div>
              <StatusBadge value={selectedEvent.status} label={getEventStatusLabel(selectedEvent.status)} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-md bg-[#fff7e8] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Registered users</p>
                <p className="mt-2 text-2xl font-bold">{totalRegistered}</p>
              </div>
              <div className="rounded-md bg-[#f5f5f5] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Present + Late</p>
                <p className="mt-2 text-2xl font-bold">{totalPresent}</p>
              </div>
              <div className="rounded-md bg-[#fff7e8] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Attendance rate</p>
                <p className="mt-2 text-2xl font-bold">{rate}%</p>
              </div>
            </div>
          </div>

          <div className="surface rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="grid size-32 shrink-0 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-white">
                {checkInUrl && qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR check-in" className="size-full object-contain" />
                ) : (
                  <QrCode size={54} className="text-neutral-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-[#1f1f1f]">QR check-in</h2>
                <p className="mt-1 text-sm text-neutral-500">Scan QR ini untuk check-in, atau salin link di bawah. User lintas cabang harus approved dulu oleh Pengawas sebelum bisa check-in.</p>
                <div className="mt-3 break-all rounded-md bg-[#f5f5f5] p-3 text-sm">{checkInUrl}</div>
                <button onClick={copyLink} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#f4b63f] px-3 py-2 text-sm font-bold text-[#1f1f1f]">
                  <ClipboardCopy size={16} /> Copy link
                </button>
              </div>
            </div>
          </div>

          <div className="surface rounded-lg p-5">
            <h2 className="font-semibold text-[#1f1f1f]">Daftar attendance</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Check-in</th>
                    <th className="px-3 py-2">Check-out</th>
                    <th className="px-3 py-2">Koreksi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvent.attendances.map((attendance) => (
                    <tr key={attendance.id} className="bg-white">
                      <td className="rounded-l-md px-3 py-3 font-semibold text-[#1f1f1f]">{personName(attendance.user)}</td>
                      <td className="px-3 py-3"><StatusBadge value={attendance.status} label={getAttendanceStatusLabel(attendance.status)} /></td>
                      <td className="px-3 py-3 text-neutral-600">{attendance.source}</td>
                      <td className="px-3 py-3 text-neutral-600">{formatDate(attendance.checkedInAt)}</td>
                      <td className="px-3 py-3 text-neutral-400">{formatDate(attendance.checkedOutAt)}</td>
                      <td className="rounded-r-md px-3 py-3">
                        <select
                          disabled={saving}
                          value={attendance.status}
                          onChange={(event) => manualUpdate(attendance.id, event.target.value)}
                          className="rounded-md border border-neutral-200 px-2 py-1.5 text-xs"
                        >
                          {attendanceStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedEvent.attendances.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Belum ada attendance record.</div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
