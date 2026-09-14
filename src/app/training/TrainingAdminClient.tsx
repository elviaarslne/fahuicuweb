"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  title: string;
  description?: string | null;
  purpose?: string | null;
  expectedOutcome?: string | null;
  status: string;
  createdAt: string;
  createdBy?: { fullName: string; chineseName?: string | null } | null;
  _count?: { batches: number };
};

type Branch = { id: string; name: string };
type UserOption = { id: string; fullName: string; chineseName?: string | null; memberCategory?: string | null };

type Batch = {
  id: string;
  trainingProgramId: string;
  title: string;
  batchCode?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  capacity?: number | null;
  program?: { id: string; title: string } | null;
  hostingBranch?: { id: string; name: string } | null;
  _count?: { sessions: number; enrollments: number };
};

type Session = {
  id: string;
  trainingBatchId: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  location?: string | null;
  materialUrl?: string | null;
  orderNumber: number;
  batch?: { id: string; title: string; program?: { id: string; title: string } | null } | null;
  trainer?: { id: string; fullName: string; chineseName?: string | null } | null;
};

type Props = {
  initialPrograms: Program[];
  initialBatches: Batch[];
  initialSessions: Session[];
  branches: Branch[];
  trainers: UserOption[];
  canCreate: boolean;
};

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

async function submitJson(url: string, form: HTMLFormElement) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  for (const [key, value] of Object.entries(payload)) {
    if (value === "") delete payload[key];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Gagal menyimpan data.");
  return json;
}

export default function TrainingAdminClient({
  initialPrograms,
  initialBatches,
  initialSessions,
  branches,
  trainers,
  canCreate,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const defaultProgramId = initialPrograms[0]?.id || "";
  const defaultBatchId = initialBatches[0]?.id || "";

  const trainerOptions = useMemo(() => trainers.map((trainer) => ({
    id: trainer.id,
    label: `${trainer.chineseName || trainer.fullName} (${trainer.fullName})`,
  })), [trainers]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>, url: string, label: string) {
    event.preventDefault();
    if (!canCreate) return;
    setBusy(label);
    setError(null);
    setMessage(null);
    try {
      await submitJson(url, event.currentTarget);
      event.currentTarget.reset();
      setMessage(`${label} berhasil dibuat.`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : `${label} gagal dibuat.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {error || message}
        </div>
      )}

      {!canCreate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Kamu bisa melihat struktur Training, tetapi pembuatan Program/Batch/Sesi hanya untuk Admin, Ketua, atau Wakil Ketua.
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6a00]">Program Training</p>
              <h2 className="mt-1 text-xl font-black text-[#1f1f1f]">Daftar Program</h2>
            </div>
            <span className="rounded-full bg-[#f8f1de] px-3 py-1 text-xs font-bold text-[#6b6254]">{initialPrograms.length} program</span>
          </div>
          <div className="mt-4 grid gap-3">
            {initialPrograms.length ? initialPrograms.map((program) => (
              <article key={program.id} className="rounded-2xl border border-[#e8ddc4] bg-white/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-[#1f1f1f]">{program.title}</h3>
                    <p className="mt-1 text-sm text-[#6b6254]">{program.description || "Belum ada deskripsi."}</p>
                  </div>
                  <span className="rounded-full bg-[#f4c62b]/20 px-3 py-1 text-xs font-black text-[#9a6a00]">{program.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6b6254]">
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{program._count?.batches ?? 0} batch</span>
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">Pembuat: {program.createdBy?.chineseName || program.createdBy?.fullName || "-"}</span>
                </div>
              </article>
            )) : (
              <p className="rounded-2xl border border-dashed border-[#e8ddc4] p-4 text-sm text-[#6b6254]">Belum ada program training.</p>
            )}
          </div>
        </div>

        <form onSubmit={(event) => handleSubmit(event, "/api/training/programs", "Program")} className="rounded-2xl border border-[#e8ddc4] bg-[#fff8e8] p-5 shadow-sm shadow-amber-900/5">
          <h2 className="text-lg font-black text-[#1f1f1f]">Buat Program</h2>
          <div className="mt-4 space-y-3">
            <input name="title" required placeholder="Judul program" className="input" disabled={!canCreate} />
            <textarea name="description" placeholder="Deskripsi singkat" className="input min-h-20" disabled={!canCreate} />
            <textarea name="purpose" placeholder="Tujuan training" className="input min-h-20" disabled={!canCreate} />
            <textarea name="expectedOutcome" placeholder="Expected outcome" className="input min-h-20" disabled={!canCreate} />
            <select name="status" className="input" defaultValue="DRAFT" disabled={!canCreate}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button className="btn-primary w-full" disabled={!canCreate || busy === "Program"}>{busy === "Program" ? "Menyimpan..." : "Create Program"}</button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6a00]">Batch Training</p>
              <h2 className="mt-1 text-xl font-black text-[#1f1f1f]">Daftar Batch</h2>
            </div>
            <span className="rounded-full bg-[#f8f1de] px-3 py-1 text-xs font-bold text-[#6b6254]">{initialBatches.length} batch</span>
          </div>
          <div className="mt-4 grid gap-3">
            {initialBatches.length ? initialBatches.map((batch) => (
              <article key={batch.id} className="rounded-2xl border border-[#e8ddc4] bg-white/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-[#1f1f1f]">{batch.title}</h3>
                    <p className="mt-1 text-sm text-[#6b6254]">{batch.program?.title || "Program tidak ditemukan"}</p>
                  </div>
                  <span className="rounded-full bg-[#f4c62b]/20 px-3 py-1 text-xs font-black text-[#9a6a00]">{batch.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6b6254]">
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{batch.hostingBranch?.name || "Semua cabang"}</span>
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{batch._count?.sessions ?? 0} sesi</span>
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{batch._count?.enrollments ?? 0} peserta</span>
                </div>
              </article>
            )) : (
              <p className="rounded-2xl border border-dashed border-[#e8ddc4] p-4 text-sm text-[#6b6254]">Belum ada batch training.</p>
            )}
          </div>
        </div>

        <form onSubmit={(event) => handleSubmit(event, "/api/training/batches", "Batch")} className="rounded-2xl border border-[#e8ddc4] bg-[#fff8e8] p-5 shadow-sm shadow-amber-900/5">
          <h2 className="text-lg font-black text-[#1f1f1f]">Buat Batch</h2>
          <div className="mt-4 space-y-3">
            <select name="trainingProgramId" required className="input" defaultValue={defaultProgramId} disabled={!canCreate || !initialPrograms.length}>
              {!initialPrograms.length && <option value="">Buat program dahulu</option>}
              {initialPrograms.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
            </select>
            <input name="title" required placeholder="Judul batch" className="input" disabled={!canCreate} />
            <input name="batchCode" placeholder="Kode batch (opsional)" className="input" disabled={!canCreate} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#6b6254]">Mulai<input name="startDate" required type="datetime-local" className="input mt-1" disabled={!canCreate} /></label>
              <label className="text-sm font-bold text-[#6b6254]">Selesai<input name="endDate" required type="datetime-local" className="input mt-1" disabled={!canCreate} /></label>
            </div>
            <select name="hostingBranchId" className="input" defaultValue="" disabled={!canCreate}>
              <option value="">Semua cabang / belum ditentukan</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
            <input name="capacity" type="number" min="1" placeholder="Kapasitas (opsional)" className="input" disabled={!canCreate} />
            <select name="status" className="input" defaultValue="DRAFT" disabled={!canCreate}>
              <option value="DRAFT">Draft</option>
              <option value="ENROLLMENT_OPEN">Enrollment Open</option>
              <option value="ENROLLMENT_CLOSED">Enrollment Closed</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button className="btn-primary w-full" disabled={!canCreate || busy === "Batch" || !initialPrograms.length}>{busy === "Batch" ? "Menyimpan..." : "Create Batch"}</button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6a00]">Sesi Training</p>
              <h2 className="mt-1 text-xl font-black text-[#1f1f1f]">Daftar Sesi</h2>
            </div>
            <span className="rounded-full bg-[#f8f1de] px-3 py-1 text-xs font-bold text-[#6b6254]">{initialSessions.length} sesi</span>
          </div>
          <div className="mt-4 grid gap-3">
            {initialSessions.length ? initialSessions.map((session) => (
              <article key={session.id} className="rounded-2xl border border-[#e8ddc4] bg-white/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-[#1f1f1f]">{session.title}</h3>
                    <p className="mt-1 text-sm text-[#6b6254]">{session.batch?.program?.title || "Program"} / {session.batch?.title || "Batch"}</p>
                  </div>
                  <span className="rounded-full bg-[#f8f1de] px-3 py-1 text-xs font-black text-[#6b6254]">#{session.orderNumber}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6b6254]">
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{formatDate(session.startAt)} - {formatDate(session.endAt)}</span>
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">Trainer: {session.trainer?.chineseName || session.trainer?.fullName || "Belum ditentukan"}</span>
                  <span className="rounded-full bg-[#f8f1de] px-2.5 py-1">{session.location || "Lokasi belum ditentukan"}</span>
                </div>
              </article>
            )) : (
              <p className="rounded-2xl border border-dashed border-[#e8ddc4] p-4 text-sm text-[#6b6254]">Belum ada sesi training.</p>
            )}
          </div>
        </div>

        <form onSubmit={(event) => handleSubmit(event, "/api/training/sessions", "Sesi")} className="rounded-2xl border border-[#e8ddc4] bg-[#fff8e8] p-5 shadow-sm shadow-amber-900/5">
          <h2 className="text-lg font-black text-[#1f1f1f]">Buat Sesi</h2>
          <div className="mt-4 space-y-3">
            <select name="trainingBatchId" required className="input" defaultValue={defaultBatchId} disabled={!canCreate || !initialBatches.length}>
              {!initialBatches.length && <option value="">Buat batch dahulu</option>}
              {initialBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.program?.title} / {batch.title}</option>)}
            </select>
            <input name="title" required placeholder="Judul sesi" className="input" disabled={!canCreate} />
            <textarea name="description" placeholder="Deskripsi sesi (opsional)" className="input min-h-20" disabled={!canCreate} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#6b6254]">Mulai<input name="startAt" required type="datetime-local" className="input mt-1" disabled={!canCreate} /></label>
              <label className="text-sm font-bold text-[#6b6254]">Selesai<input name="endAt" required type="datetime-local" className="input mt-1" disabled={!canCreate} /></label>
            </div>
            <input name="location" placeholder="Lokasi (opsional)" className="input" disabled={!canCreate} />
            <select name="trainerId" className="input" defaultValue="" disabled={!canCreate}>
              <option value="">Trainer belum ditentukan</option>
              {trainerOptions.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.label}</option>)}
            </select>
            <input name="materialUrl" placeholder="Material URL (opsional)" className="input" disabled={!canCreate} />
            <input name="orderNumber" type="number" min="0" placeholder="Urutan sesi" className="input" disabled={!canCreate} />
            <button className="btn-primary w-full" disabled={!canCreate || busy === "Sesi" || !initialBatches.length}>{busy === "Sesi" ? "Menyimpan..." : "Create Session"}</button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5">
          <h2 className="font-black text-[#1f1f1f]">Eligibility</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6254]">Struktur database sudah tersedia, tetapi UI rule umur, class level, role, division, dan manual user belum diaktifkan pada fondasi kecil ini.</p>
        </article>
        <article className="rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-5">
          <h2 className="font-black text-[#1f1f1f]">Completion Rules</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6254]">Rule kelulusan tersedia secara struktural. Assignment, exam, grading, dan certificate sengaja belum dibuat.</p>
        </article>
      </section>
    </div>
  );
}
