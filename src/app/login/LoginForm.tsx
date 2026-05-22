"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    setLoading(false);
    if (!response.ok) {
      setError(data?.error || "Login gagal.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-[#1f1f1f]">Email</span>
        <input
          name="email"
          className="focus-ring mt-2 w-full rounded-xl border border-[#e8ddc4] bg-white px-3 py-2.5 text-[#1f1f1f] placeholder:text-[#6b6254]/55"
          placeholder="admin@fahuicu.org"
          type="email"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[#1f1f1f]">Password</span>
        <input
          name="password"
          className="focus-ring mt-2 w-full rounded-xl border border-[#e8ddc4] bg-white px-3 py-2.5 text-[#1f1f1f] placeholder:text-[#6b6254]/55"
          type="password"
          placeholder="Password"
          required
        />
      </label>
      {error ? (
        <div className="rounded-xl border border-[#c62828]/25 bg-[#c62828]/8 px-3 py-2 text-sm text-[#c62828]">
          {error}
        </div>
      ) : null}
      <button
        className="focus-ring w-full rounded-xl bg-[#f4c62b] px-4 py-2.5 text-sm font-bold text-[#1f1f1f] shadow-sm shadow-amber-900/10 transition hover:bg-[#e8b923] disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
}
