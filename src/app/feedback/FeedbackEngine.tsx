"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { getEventStatusLabel } from "@/lib/event-options";
import {
  feedbackScaleOptions,
  objectiveFeedbackItems,
  operationalFeedbackItems,
  transformationFeedbackItems,
} from "@/lib/feedback-options";

type FeedbackEvent = {
  id: string;
  title: string;
  category: string;
  purpose: string;
  expectedOutcome: string;
  status: string;
  startAt: string;
  participantCount: number;
  feedbackCount: number;
  canSubmit: boolean;
  alreadySubmitted: boolean;
  userFeedback: UserFeedback | null;
  summary: {
    objective: number | null;
    transformation: number | null;
    operational: number | null;
    purposeAchievement: number | null;
  } | null;
  comments: Array<{
    id: string;
    user: { fullName: string; chineseName: string | null };
    insightText: string;
    improvementText: string;
  }>;
};

type UserFeedback = {
  id: string;
  materialPurposeRating: number | null;
  deliveryClarityRating: number | null;
  timeEffectivenessRating: number | null;
  flowClarityRating: number | null;
  perspectiveChangeRating: number | null;
  joinAgainRating: number | null;
  understandingRating: number | null;
  registrationEaseRating: number | null;
  coordinationClarityRating: number | null;
  locationComfortRating: number | null;
  insightText: string | null;
  learnedText: string | null;
  improvementText: string | null;
};

const metricGroups = [
  { title: "Objective metrics", description: "Mengukur apakah acara mencapai tujuan pembelajaran.", items: objectiveFeedbackItems },
  { title: "Transformation metrics", description: "Mengukur perubahan pemahaman dan niat lanjut.", items: transformationFeedbackItems },
  { title: "Operational metrics", description: "Mengukur pengalaman operasional acara.", items: operationalFeedbackItems },
];

function ScoreBox({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-[#fff7e8] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">{value ? `${value}/5` : "-"}</p>
    </div>
  );
}

function feedbackRating(feedback: UserFeedback | null | undefined, name: string) {
  const value = feedback?.[name as keyof UserFeedback];
  return typeof value === "number" ? value : 4;
}

function RatingField({ name, label, value }: { name: string; label: string; value?: number | null }) {
  return (
    <label className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
      <span className="font-medium text-[#1f1f1f]">{label}</span>
      <select name={name} defaultValue={String(value ?? 4)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2">
        {feedbackScaleOptions.map((value) => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
    </label>
  );
}

export default function FeedbackEngine() {
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0],
    [events, selectedEventId],
  );

  async function loadFeedback() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal mengambil feedback.");
      setEvents(data.events);
      setSelectedEventId((current) => current || data.events[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil feedback.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function submitFeedback(formData: FormData) {
    if (!selectedEvent) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, eventId: selectedEvent.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal menyimpan feedback.");
      setMessage("Feedback berhasil disimpan dan terhubung ke identitas user.");
      await loadFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan feedback.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Memuat feedback engine...</div>;
  }

  return (
    <div className="mt-5 grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <div className="surface rounded-lg p-5">
          <h2 className="font-semibold text-[#1f1f1f]">Pilih event</h2>
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
        <div className="surface rounded-lg p-5">
          <h2 className="font-semibold text-[#1f1f1f]">Struktur evaluasi</h2>
          <div className="mt-4 grid gap-3 text-sm text-neutral-700">
            {metricGroups.map((group) => (
              <div key={group.title} className="rounded-md bg-[#fff7e8] p-3">
                <p className="font-semibold text-[#1f1f1f]">{group.title}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{group.description}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="space-y-5">
        {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {!selectedEvent ? (
          <div className="surface rounded-lg p-5 text-sm text-neutral-500">Belum ada event feedback.</div>
        ) : (
          <>
            <div className="surface rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-500">{selectedEvent.category} • {new Date(selectedEvent.startAt).toLocaleString("id-ID")}</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1f1f1f]">{selectedEvent.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{selectedEvent.purpose}</p>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">Expected: {selectedEvent.expectedOutcome}</p>
                </div>
                <StatusBadge value={selectedEvent.status} label={getEventStatusLabel(selectedEvent.status)} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <ScoreBox label="Objective" value={selectedEvent.summary?.objective ?? null} />
                <ScoreBox label="Transformation" value={selectedEvent.summary?.transformation ?? null} />
                <ScoreBox label="Operational" value={selectedEvent.summary?.operational ?? null} />
                <ScoreBox label="Purpose score" value={selectedEvent.summary?.purposeAchievement ?? null} />
                <div className="rounded-md bg-[#f5f5f5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Feedback</p>
                  <p className="mt-2 text-2xl font-bold text-[#1f1f1f]">{selectedEvent.feedbackCount}</p>
                </div>
              </div>
            </div>

            <form
              key={`${selectedEvent.id}-${selectedEvent.userFeedback?.id || "new"}`}
              className="surface rounded-lg p-5"
              onSubmit={(event) => {
                event.preventDefault();
                submitFeedback(new FormData(event.currentTarget));
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[#1f1f1f]">Form feedback peserta</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {selectedEvent.alreadySubmitted ? "Feedback sebelumnya akan diperbarui." : "Feedback hanya aktif saat lifecycle Feedback Collection."}
                  </p>
                </div>
                {!selectedEvent.canSubmit ? <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-bold text-neutral-500">Belum dibuka</span> : null}
              </div>

              <div className="mt-5 space-y-5">
                {metricGroups.map((group) => (
                  <fieldset key={group.title} className="rounded-lg border border-neutral-200 bg-[#f5f5f5] p-4">
                    <legend className="px-1 text-sm font-bold text-[#1f1f1f]">{group.title}</legend>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {group.items.map((item) => (
                        <RatingField
                          key={item.name}
                          name={item.name}
                          label={item.label}
                          value={feedbackRating(selectedEvent.userFeedback, item.name)}
                        />
                      ))}
                    </div>
                  </fieldset>
                ))}

                <textarea
                  name="insightText"
                  className="min-h-24 w-full rounded-md border border-neutral-200 px-3 py-2"
                  placeholder="Apa insight utama yang didapat?"
                  defaultValue={selectedEvent.userFeedback?.insightText || ""}
                  required
                />
                <textarea
                  name="learnedText"
                  className="min-h-24 w-full rounded-md border border-neutral-200 px-3 py-2"
                  placeholder="Apa yang dipelajari secara Dharma?"
                  defaultValue={selectedEvent.userFeedback?.learnedText || ""}
                  required
                />
                <textarea
                  name="improvementText"
                  className="min-h-24 w-full rounded-md border border-neutral-200 px-3 py-2"
                  placeholder="Apa yang perlu diperbaiki?"
                  defaultValue={selectedEvent.userFeedback?.improvementText || ""}
                  required
                />
              </div>

              <button disabled={saving || !selectedEvent.canSubmit} className="mt-5 rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">
                {saving ? "Menyimpan..." : selectedEvent.alreadySubmitted ? "Simpan perubahan feedback" : "Kirim feedback"}
              </button>
            </form>

            <div className="surface rounded-lg p-5">
              <h2 className="font-semibold text-[#1f1f1f]">Insight dan improvement</h2>
              <div className="mt-4 grid gap-3">
                {selectedEvent.comments.length === 0 ? (
                  <p className="text-sm text-neutral-500">Summary detail hanya tampil untuk Admin, Ketua, atau Trainer/Speaker terkait.</p>
                ) : null}
                {selectedEvent.comments.map((comment) => (
                  <article key={comment.id} className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
                    <p className="font-semibold text-[#1f1f1f]">{comment.user.chineseName || comment.user.fullName}</p>
                    <p className="mt-2 text-neutral-600">Insight: {comment.insightText}</p>
                    <p className="mt-1 text-neutral-500">Improvement: {comment.improvementText}</p>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
