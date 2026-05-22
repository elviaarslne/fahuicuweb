"use client";

import { useEffect, useState } from "react";
import { FileAudio, FileText, FileVideo, Pencil, Trash2 } from "lucide-react";

type Material = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  eventId: string | null;
  classLevelId: string | null;
  event?: { id: string; title: string; hostingBranch?: { name: string } | null } | null;
  classLevel?: { id: string; name: string } | null;
};

type EventOption = { id: string; title: string; hostingBranch?: { name: string } | null };
type ClassLevel = { id: string; name: string };

function iconForType(type: string) {
  if (["MP3"].includes(type)) return FileAudio;
  if (["MP4", "VIDEO_LINK"].includes(type)) return FileVideo;
  return FileText;
}

export default function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [manageableEventIds, setManageableEventIds] = useState<string[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  async function loadMaterials() {
    setError(null);
    const [materialsResponse, eventsResponse] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/events"),
    ]);
    const materialsData = await materialsResponse.json();
    const eventsData = await eventsResponse.json();
    if (!materialsResponse.ok) throw new Error(materialsData?.error || "Gagal mengambil materi.");
    setMaterials(materialsData.materials || []);
    setManageableEventIds(materialsData.manageableEventIds || []);
    setEvents(eventsData.events || []);
    setClassLevels(eventsData.classLevels || []);
  }

  useEffect(() => {
    loadMaterials().catch((err) => setError(err instanceof Error ? err.message : "Gagal mengambil materi."));
  }, []);

  async function saveMaterial(formData: FormData) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(editingMaterial ? `/api/materials/${editingMaterial.id}` : "/api/materials", {
        method: editingMaterial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description") || null,
          type: formData.get("type"),
          fileUrl: formData.get("fileUrl"),
          eventId: formData.get("eventId") || null,
          classLevelId: formData.get("classLevelId") || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal simpan materi.");
      setMessage(editingMaterial ? "Materi berhasil diperbarui." : "Materi berhasil disimpan.");
      setEditingMaterial(null);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload materi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMaterial(id: string) {
    setError(null);
    const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || "Gagal hapus materi.");
      return;
    }
    setMaterials((current) => current.filter((material) => material.id !== id));
    setMessage("Materi berhasil dihapus.");
  }

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]">
      {manageableEventIds.length ? <form
        className="rounded-lg border border-neutral-200 bg-[#fff7e8] p-4"
        onSubmit={(event) => {
          event.preventDefault();
          saveMaterial(new FormData(event.currentTarget));
        }}
      >
        <h2 className="font-semibold text-[#1f1f1f]">{editingMaterial ? "Edit materi" : "Upload / tambah materi"}</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">V1 memakai URL/path file. Akses tetap divalidasi di server.</p>
        <div className="mt-4 grid gap-3">
          <input name="title" key={`title-${editingMaterial?.id || "new"}`} defaultValue={editingMaterial?.title || ""} className="rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Judul materi" required />
          <select name="type" key={`type-${editingMaterial?.id || "new"}`} className="rounded-md border border-neutral-200 px-3 py-2 text-sm" defaultValue={editingMaterial?.type || "PDF"}>
            {["PDF", "PPT", "MP3", "MP4", "VIDEO_LINK", "NOTES", "OTHER"].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input name="fileUrl" key={`url-${editingMaterial?.id || "new"}`} defaultValue={editingMaterial?.fileUrl || ""} className="rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="URL/path file" required />
          <select name="eventId" key={`event-${editingMaterial?.id || "new"}`} className="rounded-md border border-neutral-200 px-3 py-2 text-sm" defaultValue={editingMaterial?.eventId || ""} required>
            <option value="">Pilih event</option>
            {events.filter((event) => manageableEventIds.includes(event.id)).map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
          <select name="classLevelId" key={`class-${editingMaterial?.id || "new"}`} className="rounded-md border border-neutral-200 px-3 py-2 text-sm" defaultValue={editingMaterial?.classLevelId || ""}>
            <option value="">Kelas opsional</option>
            {classLevels.map((classLevel) => <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>)}
          </select>
          <textarea name="description" key={`desc-${editingMaterial?.id || "new"}`} defaultValue={editingMaterial?.description || ""} className="min-h-20 rounded-md border border-neutral-200 px-3 py-2 text-sm" placeholder="Deskripsi opsional" />
          <button disabled={saving} className="rounded-md bg-[#f4b63f] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] disabled:opacity-60">
            {saving ? "Menyimpan..." : editingMaterial ? "Update materi" : "Simpan materi"}
          </button>
          {editingMaterial ? <button type="button" onClick={() => setEditingMaterial(null)} className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-600">Batal edit</button> : null}
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </form> : (
        <div className="rounded-lg border border-neutral-200 bg-[#fff7e8] p-4 text-sm leading-6 text-neutral-600">
          Kamu bisa melihat materi event yang diikuti. Upload/edit/delete hanya tersedia untuk Admin/Ketua/Sub-ketua atau Trainer/Speaker yang ditugaskan.
          {error ? <p className="mt-3 text-red-700">{error}</p> : null}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {materials.map((material) => {
          const Icon = iconForType(material.type);
          return (
            <article key={material.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-[#fff7e8] text-[#1f1f1f]">
                  <Icon size={20} />
                </div>
                {material.eventId && manageableEventIds.includes(material.eventId) ? <div className="flex gap-2">
                  <button className="rounded-md border border-neutral-200 p-2 text-neutral-700 hover:bg-[#fff7e8]" onClick={() => setEditingMaterial(material)} type="button" aria-label="Edit materi">
                    <Pencil size={16} />
                  </button>
                  <button className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50" onClick={() => deleteMaterial(material.id)} type="button" aria-label="Hapus materi">
                    <Trash2 size={16} />
                  </button>
                </div> : null}
              </div>
              <h2 className="mt-4 font-semibold text-[#1f1f1f]">{material.title}</h2>
              <p className="mt-2 text-sm text-neutral-500">{material.type} • {material.event?.title || "Event umum"} • {material.classLevel?.name || "Semua kelas"}</p>
              {material.description ? <p className="mt-2 text-sm leading-6 text-neutral-600">{material.description}</p> : null}
              <a className="mt-3 inline-flex text-sm font-semibold text-[#8a640f] underline" href={material.fileUrl} target="_blank">Buka materi</a>
            </article>
          );
        })}
        {materials.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
            Belum ada materi yang bisa kamu akses.
          </div>
        ) : null}
      </div>
    </div>
  );
}
