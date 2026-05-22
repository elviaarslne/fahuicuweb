"use client";

import { useEffect, useState } from "react";

export default function ActivityProfile({
  displayName,
  email,
  profilePhotoUrl,
  postCount,
}: {
  displayName: string;
  email: string;
  profilePhotoUrl?: string | null;
  postCount: number;
}) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    setUsername(window.localStorage.getItem("fhc_activity_username") || "");
  }, []);

  function saveUsername(value: string) {
    setUsername(value);
    window.localStorage.setItem("fhc_activity_username", value);
  }

  return (
    <section className="rounded-3xl border border-[#e8ddc4] bg-[#fffdf7] p-5 shadow-sm shadow-amber-900/5">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f8f1de] text-2xl font-black text-[#a17700] ring-4 ring-[#fff8e8]">
          {profilePhotoUrl ? <img src={profilePhotoUrl} alt={displayName} className="h-full w-full object-cover" /> : displayName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black text-[#1f1f1f]">{displayName}</h1>
          <p className="mt-1 truncate text-sm text-[#6b6254]">{username ? `@${username}` : email}</p>
          <p className="mt-2 text-sm font-semibold text-[#a17700]">{postCount} post internal</p>
        </div>
      </div>
      <label className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-[#6b6254]">
        Creative username
        <input
          value={username}
          onChange={(event) => saveUsername(event.target.value.replace(/^@/, "").trim())}
          placeholder="contoh: dharmajourney"
          className="mt-2 w-full rounded-2xl border border-[#e8ddc4] bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#1f1f1f] placeholder:text-[#6b6254]/55"
        />
      </label>
    </section>
  );
}
