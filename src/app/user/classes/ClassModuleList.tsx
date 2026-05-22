"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, FileText, Link as LinkIcon, X } from "lucide-react";

type ModuleItem = {
  id: string;
  title: string;
  description: string | null;
  materialUrl: string | null;
  classLevelName: string | null;
  progress: {
    isCompleted: boolean;
    completedAt: string | null;
    notes: string | null;
    photoUrl: string | null;
  } | null;
};

function materialLabel(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes(".ppt") || lower.includes("presentation")) return "PPT";
  if (lower.includes(".pdf")) return "PDF";
  return "Link";
}

function materialIcon(url: string) {
  return materialLabel(url) === "Link" ? <LinkIcon size={16} /> : <FileText size={16} />;
}

export default function ClassModuleList({ modules }: { modules: ModuleItem[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [localModules, setLocalModules] = useState(modules);
  const [message, setMessage] = useState("");
  const selected = useMemo(() => localModules.find((module) => module.id === selectedId) ?? null, [localModules, selectedId]);

  async function saveProgress(moduleId: string, payload: { isCompleted: boolean; completedAt?: string | null; notes?: string | null; photoUrl?: string | null }) {
    const response = await fetch(`/api/learning-modules/${moduleId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Progress gagal disimpan.");
      return false;
    }
    setLocalModules((items) => items.map((item) => item.id === moduleId ? {
      ...item,
      progress: {
        isCompleted: data.progress.isCompleted,
        completedAt: data.progress.completedAt,
        notes: data.progress.notes,
        photoUrl: data.progress.photoUrl,
      },
    } : item));
    return true;
  }

  async function toggleComplete(module: ModuleItem, checked: boolean) {
    const ok = await saveProgress(module.id, {
      isCompleted: checked,
      completedAt: checked ? new Date().toISOString() : null,
      notes: module.progress?.notes ?? null,
      photoUrl: module.progress?.photoUrl ?? null,
    });
    if (ok) {
      setMessage(checked ? "Modul selesai. Silakan isi survey topik." : "Status modul diperbarui.");
    }
  }

  async function submitDetail(formData: FormData) {
    if (!selected) return;
    const ok = await saveProgress(selected.id, {
      isCompleted: formData.get("isCompleted") === "on",
      completedAt: formData.get("completedAt") ? String(formData.get("completedAt")) : null,
      notes: formData.get("notes") ? String(formData.get("notes")) : null,
      photoUrl: formData.get("photoUrl") ? String(formData.get("photoUrl")) : null,
    });
    if (ok) setMessage("Progress modul tersimpan.");
  }

  if (!localModules.length) {
    return <p className="rounded-2xl border border-[#e8ddc4] bg-white p-5 text-sm text-[#6b6254]">Belum ada modul untuk kelas saat ini.</p>;
  }

  if (selected) {
    return (
      <section className="rounded-3xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
        <button type="button" onClick={() => setSelectedId("")} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8ddc4] bg-white px-4 py-2 text-sm font-bold text-[#1f1f1f] hover:bg-[#fff8e8]">
          <ArrowLeft size={16} />
          Kembali ke daftar modul
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a17700]">Detail topik</p>
            <h3 className="mt-2 text-xl font-black text-[#1f1f1f]">{selected.title}</h3>
            <p className="mt-1 text-sm text-[#6b6254]">{selected.classLevelName || "Modul umum"} • Pembawa acara belum ditentukan</p>
          </div>
          {selected.progress?.isCompleted ? <span className="rounded-full bg-[#f4c62b]/25 px-3 py-1 text-xs font-black text-[#8a6b00]">Selesai</span> : null}
        </div>

        {selected.description ? <p className="mt-4 text-sm leading-6 text-[#6b6254]">{selected.description}</p> : null}

        <div className="mt-5">
          <p className="text-sm font-black text-[#1f1f1f]">Materi pembawa acara</p>
          {selected.materialUrl ? (
            <a href={selected.materialUrl} target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#e8ddc4] bg-white px-4 py-2 text-sm font-bold text-[#1f1f1f] hover:bg-[#fff8e8]">
              {materialIcon(selected.materialUrl)}
              {materialLabel(selected.materialUrl)}
            </a>
          ) : (
            <p className="mt-2 rounded-2xl bg-[#f8f1de] p-3 text-sm text-[#6b6254]">Materi belum tersedia.</p>
          )}
        </div>

        <form action={submitDetail} className="mt-5 space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-[#1f1f1f]">
            <input name="isCompleted" type="checkbox" defaultChecked={selected.progress?.isCompleted} className="size-4 accent-[#f4c62b]" />
            Sudah diikuti
          </label>
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6b6254]">
            Tanggal selesai
            <input name="completedAt" type="date" defaultValue={selected.progress?.completedAt ? selected.progress.completedAt.slice(0, 10) : ""} className="mt-2 w-full rounded-2xl border border-[#e8ddc4] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[#1f1f1f]" />
          </label>
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6b6254]">
            Catatan pribadi
            <textarea name="notes" defaultValue={selected.progress?.notes || ""} className="mt-2 min-h-28 w-full rounded-2xl border border-[#e8ddc4] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[#1f1f1f]" />
          </label>
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6b6254]">
            Foto / URL bukti
            <input name="photoUrl" defaultValue={selected.progress?.photoUrl || ""} className="mt-2 w-full rounded-2xl border border-[#e8ddc4] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[#1f1f1f]" />
          </label>
          <button className="w-full rounded-2xl bg-[#f4c62b] px-4 py-3 text-sm font-black text-[#1f1f1f] hover:bg-[#e8b923]">Simpan progress</button>
        </form>

        {message ? (
          <div className="mt-4 rounded-2xl border border-[#e8ddc4] bg-white p-3 text-sm text-[#6b6254]">
            <div className="flex items-start justify-between gap-3">
              <p>{message}</p>
              <button type="button" onClick={() => setMessage("")} className="text-[#6b6254]"><X size={16} /></button>
            </div>
            {message.includes("survey") ? <a href="/feedback" className="mt-2 inline-flex text-sm font-black text-[#a17700]">Isi survey topik</a> : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e8ddc4] bg-white shadow-sm shadow-amber-900/5">
      {localModules.map((module, index) => {
        const completed = Boolean(module.progress?.isCompleted);
        return (
          <button
            key={module.id}
            type="button"
            onClick={() => setSelectedId(module.id)}
            className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 bg-white px-4 py-3 text-left transition hover:bg-[#fff8e8] ${index ? "border-t border-[#e8ddc4]" : ""}`}
          >
            <span
              role="checkbox"
              aria-checked={completed}
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                toggleComplete(module, !completed);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleComplete(module, !completed);
                }
              }}
              className={`grid size-8 place-items-center rounded-full border text-sm ${completed ? "border-[#f4c62b] bg-[#f4c62b] text-[#1f1f1f]" : "border-[#e8ddc4] bg-[#fffdf7] text-transparent"}`}
            >
              <Check size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[#1f1f1f]">{module.title}</span>
              <span className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-[#6b6254]">
                <span>{module.classLevelName || "Modul umum"}</span>
                <span>•</span>
                <span>Pembawa acara belum ditentukan</span>
                {module.progress?.completedAt ? (
                  <>
                    <span>•</span>
                    <span>{new Date(module.progress.completedAt).toLocaleDateString("id-ID")}</span>
                  </>
                ) : null}
              </span>
            </span>
            <ChevronRight size={18} className="text-[#6b6254]" />
          </button>
        );
      })}
    </section>
  );
}
