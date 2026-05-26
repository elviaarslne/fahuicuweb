"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Field = {
  name: string;
  label: string;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  defaultValue?: string | number | null;
};

export function AdminCreateForm({ endpoint, fields, buttonLabel }: { endpoint: string; fields: Field[]; buttonLabel: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(formData: FormData) {
    setMessage("");
    const payload: Record<string, FormDataEntryValue | string> = Object.fromEntries(formData.entries());
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") payload[key] = "";
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      router.refresh();
      setMessage("Data tersimpan.");
    } else {
      setMessage(data.error || "Gagal menyimpan data.");
    }
  }

  return (
    <form action={submit} className="surface rounded-lg p-5">
      <h2 className="text-lg font-semibold text-neutral-950">{buttonLabel}</h2>
      <div className="mt-4 grid gap-3">
        {fields.map((field) => (
          <label key={field.name} className="grid gap-1 text-sm font-semibold text-neutral-700">
            {field.label}
            {field.textarea ? (
              <textarea name={field.name} defaultValue={field.defaultValue ?? ""} placeholder={field.placeholder} className="min-h-24 rounded-lg border border-black/10 px-3 py-2 font-normal" />
            ) : (
              <input name={field.name} type={field.type || "text"} defaultValue={field.defaultValue ?? ""} placeholder={field.placeholder} className="rounded-lg border border-black/10 px-3 py-2 font-normal" />
            )}
          </label>
        ))}
      </div>
      <button className="btn-primary mt-4 px-4 py-2 text-sm font-bold">Simpan</button>
      {message ? <p className="mt-3 text-xs font-medium text-[#6b6254]">{message}</p> : null}
    </form>
  );
}

export function AdminPatchButton({ endpoint, payload, label }: { endpoint: string; payload: Record<string, unknown>; label: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function patch() {
    setMessage("");
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) router.refresh();
    setMessage(data.error || "Updated.");
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={patch} className="btn-secondary px-3 py-1.5 text-xs font-bold">{label}</button>
      {message ? <span className="text-xs text-[#6b6254]">{message}</span> : null}
    </span>
  );
}

export function AdminInlineEditForm({ endpoint, fields, title = "Edit" }: { endpoint: string; fields: Field[]; title?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(formData: FormData) {
    setMessage("");
    const payload: Record<string, FormDataEntryValue | string | boolean | null> = Object.fromEntries(formData.entries());
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") payload[key] = key === "stock" ? null : "";
      if (key === "isActive") payload[key] = payload[key] === "true";
    }
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      router.refresh();
      setOpen(false);
      setMessage("Updated.");
    } else {
      setMessage(data.error || "Gagal update data.");
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen((value) => !value)} className="btn-secondary px-3 py-1.5 text-xs font-bold">
        {open ? "Tutup" : title}
      </button>
      {open ? (
        <form action={submit} className="rounded-xl border border-[#e8ddc4] bg-[#fffdf7] p-3">
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className={`grid gap-1 text-xs font-bold text-[#6b6254] ${field.textarea ? "md:col-span-2" : ""}`}>
                {field.label}
                {field.textarea ? (
                  <textarea name={field.name} defaultValue={field.defaultValue ?? ""} placeholder={field.placeholder} className="min-h-20 rounded-lg border border-[#e8ddc4] bg-white px-3 py-2 font-normal text-[#1f1f1f]" />
                ) : field.type === "select-active" ? (
                  <select name={field.name} defaultValue={String(field.defaultValue ?? true)} className="rounded-lg border border-[#e8ddc4] bg-white px-3 py-2 font-normal text-[#1f1f1f]">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <input name={field.name} type={field.type || "text"} defaultValue={field.defaultValue ?? ""} placeholder={field.placeholder} className="rounded-lg border border-[#e8ddc4] bg-white px-3 py-2 font-normal text-[#1f1f1f]" />
                )}
              </label>
            ))}
          </div>
          <button className="btn-primary mt-3 px-4 py-2 text-xs font-bold">Simpan Edit</button>
        </form>
      ) : null}
      {message ? <p className="text-xs text-[#6b6254]">{message}</p> : null}
    </div>
  );
}

export function AdminDeleteButton({ endpoint, label = "Delete", confirmMessage = "Hapus data ini?" }: { endpoint: string; label?: string; confirmMessage?: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function remove() {
    if (!window.confirm(confirmMessage)) return;
    setMessage("");
    const response = await fetch(endpoint, { method: "DELETE" });
    const data = await response.json();
    if (response.ok) {
      router.refresh();
      setMessage("Deleted.");
    } else {
      setMessage(data.error || "Gagal menghapus data.");
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={remove} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
        {label}
      </button>
      {message ? <span className="text-xs text-[#6b6254]">{message}</span> : null}
    </span>
  );
}
