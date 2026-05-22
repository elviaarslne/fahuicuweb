"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Settings, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { workspaceOptions, type Workspace } from "@/lib/workspace";

type AccountMenuProps = {
  displayName: string;
  email?: string | null;
  titleCn: string;
  profilePhotoUrl?: string | null;
  activeWorkspace: Workspace;
  workspaces: Workspace[];
};

export default function AccountMenu({ displayName, email, titleCn, profilePhotoUrl, activeWorkspace, workspaces }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function switchWorkspace(workspace: Workspace) {
    await fetch("/api/settings/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace }),
    });
    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        className="ml-1 flex items-center gap-3 rounded-full border border-[#e8ddc4] bg-[#fffdf7] py-1 pl-1 pr-3 text-left shadow-sm shadow-amber-950/5"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <div className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-[#f8f1de] text-[#1f1f1f]">
          {profilePhotoUrl ? (
            <Image src={profilePhotoUrl} alt={displayName} fill className="object-cover" />
          ) : (
            <UserCircle size={24} />
          )}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-4 text-[#1f1f1f]">{displayName}</p>
          <p className="text-xs leading-4 text-[#6b6254]">{titleCn}</p>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-[#e8ddc4] bg-[#fffdf7] p-2 shadow-xl shadow-amber-950/10">
          <div className="rounded-xl bg-[#fff8e8] p-3">
            <p className="text-sm font-bold text-[#1f1f1f]">{displayName}</p>
            <p className="mt-1 text-xs text-[#6b6254]">{email || "Email belum tersedia"}</p>
            <p className="mt-1 text-xs text-[#a17700]">{titleCn}</p>
          </div>
          <Link
            href="/settings"
            className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#1f1f1f]/80 hover:bg-[#fff8e8]"
            onClick={() => setOpen(false)}
          >
            <Settings size={16} />
            Settings
          </Link>
          <div className="mt-2 border-t border-[#e8ddc4] pt-2">
            <p className="px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6b6254]">Switch workspace</p>
            {workspaceOptions.filter((item) => workspaces.includes(item.value)).map((item) => (
              <button
                key={item.value}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${activeWorkspace === item.value ? "bg-[#f4c62b]/18 text-[#1f1f1f]" : "text-[#1f1f1f]/80 hover:bg-[#fff8e8]"}`}
                onClick={() => switchWorkspace(item.value)}
                type="button"
              >
                {item.label}
                <span className="block text-xs font-normal text-[#6b6254]">{item.description}</span>
              </button>
            ))}
          </div>
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#c62828] hover:bg-[#c62828]/8 disabled:opacity-60"
            disabled={loggingOut}
            onClick={logout}
            type="button"
          >
            <LogOut size={16} />
            {loggingOut ? "Logout..." : "Logout"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
