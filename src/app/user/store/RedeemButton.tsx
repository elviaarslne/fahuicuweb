"use client";

import { useState } from "react";

export default function RedeemButton({ rewardId, disabled }: { rewardId: string; disabled: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function redeem() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/store/${rewardId}/redeem`, { method: "POST" });
    const data = await response.json();
    setBusy(false);
    setMessage(data.error || "Redeem request dibuat. Credit sudah dikurangi.");
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={redeem} disabled={busy || disabled} className="rounded-full bg-[#f4b63f] px-4 py-2 text-sm font-bold text-black hover:bg-[#e4a72f] disabled:opacity-50">
        Redeem
      </button>
      {message ? <p className="mt-2 text-xs font-medium text-neutral-600">{message}</p> : null}
    </div>
  );
}
