"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { workspaceOptions, type Workspace } from "@/lib/workspace";

export default function WorkspaceForm({ workspaces, activeWorkspace }: { workspaces: Workspace[]; activeWorkspace: Workspace }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<Workspace | null>(null);

  async function switchWorkspace(workspace: Workspace) {
    setSwitching(workspace);
    setError(null);
    try {
      const response = await fetch("/api/settings/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Gagal switch workspace.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal switch workspace.");
      setSwitching(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="surface grid gap-2 rounded-lg p-5">
        {workspaceOptions.filter((item) => workspaces.includes(item.value)).map((item) => (
          <button
            key={item.value}
            className={`rounded-md border px-3 py-2 text-left text-sm disabled:opacity-60 ${activeWorkspace === item.value ? "border-[#f4b63f] bg-[#fff7e8]" : "border-neutral-200 bg-white"}`}
            onClick={() => switchWorkspace(item.value)}
            disabled={switching !== null}
            type="button"
          >
            <strong>{item.label}</strong>
            <span className="block text-xs text-neutral-500">{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
