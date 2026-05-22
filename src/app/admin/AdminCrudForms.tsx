"use client";

import { useState } from "react";

type Field = { name: string; label: string; type?: string; textarea?: boolean; placeholder?: string };

export function AdminCreateForm({ endpoint, fields, buttonLabel }: { endpoint: string; fields: Field[]; buttonLabel: string }) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    const payload = Object.fromEntries(formData.entries());
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") payload[key] = "";
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setMessage(data.error || "Data tersimpan. Refresh halaman untuk melihat update.");
  }

  return (
    <form action={submit} className="surface rounded-lg p-5">
      <h2 className="text-lg font-semibold text-neutral-950">{buttonLabel}</h2>
      <div className="mt-4 grid gap-3">
        {fields.map((field) => (
          <label key={field.name} className="grid gap-1 text-sm font-semibold text-neutral-700">
            {field.label}
            {field.textarea ? (
              <textarea name={field.name} placeholder={field.placeholder} className="min-h-24 rounded-lg border border-black/10 px-3 py-2 font-normal" />
            ) : (
              <input name={field.name} type={field.type || "text"} placeholder={field.placeholder} className="rounded-lg border border-black/10 px-3 py-2 font-normal" />
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
  async function patch() {
    setMessage("");
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setMessage(data.error || "Updated.");
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={patch} className="btn-secondary px-3 py-1.5 text-xs font-bold">{label}</button>
      {message ? <span className="text-xs text-[#6b6254]">{message}</span> : null}
    </span>
  );
}
