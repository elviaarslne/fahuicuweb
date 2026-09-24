"use client";

import { useEffect, useMemo, useState } from "react";
import { SkeletonList } from "@/components/Skeleton";
import { dictionary, type Locale } from "@/lib/i18n";
import { jakartaDayBoundsUtc, jakartaMonthBoundsUtc, jakartaWeekBoundsUtc } from "@/lib/jakarta-time";
import { scheduleProgramOptions } from "@/lib/schedule-options";

type ScheduleEntry = {
  id: string;
  date: string;
  titleZh: string;
  titleId: string | null;
  instructorName: string | null;
  program: string;
  classLabel: string;
  startTime: string | null;
  endTime: string | null;
  linkedEventId: string | null;
  duplicateStatus?: string;
};

type QuickRange = "all" | "today" | "week" | "month";

function formatDateHeading(dateKey: string, locale: Locale) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale === "zh-TW" ? "zh-TW" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function dateKeyOf(isoString: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(isoString));
}

function programLabel(program: string) {
  return scheduleProgramOptions.find((item) => item.value === program)?.label || program;
}

export default function ScheduleEngine({ locale }: { locale: Locale }) {
  const t = dictionary[locale].schedule;
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState("ALL");
  const [quickRange, setQuickRange] = useState<QuickRange>("month");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (program !== "ALL") params.set("program", program);
        if (search.trim()) params.set("q", search.trim());
        if (quickRange !== "all") {
          const bounds =
            quickRange === "today" ? jakartaDayBoundsUtc() : quickRange === "week" ? jakartaWeekBoundsUtc() : jakartaMonthBoundsUtc();
          params.set("from", bounds.start.toISOString());
          params.set("to", bounds.end.toISOString());
        }
        const response = await fetch(`/api/schedule?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Gagal mengambil jadwal.");
        if (!cancelled) setEntries(data.entries);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal mengambil jadwal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [program, quickRange, search]);

  const groups = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      const key = dateKeyOf(entry.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  return (
    <div className="space-y-5">
      <div className="surface rounded-lg p-5">
        <h1 className="text-xl font-black text-[#1f1f1f]">{t.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t.subtitle}</p>
      </div>

      <div className="surface flex flex-wrap gap-2 rounded-lg p-3">
        {([
          ["today", t.today],
          ["week", t.thisWeek],
          ["month", t.thisMonth],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setQuickRange(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              quickRange === value ? "bg-[#f4b63f] text-[#1f1f1f]" : "bg-white text-neutral-600 hover:bg-[#fff7e8]"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setQuickRange("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            quickRange === "all" ? "bg-[#f4b63f] text-[#1f1f1f]" : "bg-white text-neutral-600 hover:bg-[#fff7e8]"
          }`}
        >
          {t.allRange}
        </button>
      </div>

      <div className="surface flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm sm:flex-1"
        />
        <select
          value={program}
          onChange={(event) => setProgram(event.target.value)}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm sm:w-auto"
        >
          <option value="ALL">{t.allPrograms}</option>
          {scheduleProgramOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <SkeletonList cards={3} lines={4} />
      ) : groups.length === 0 ? (
        <div className="surface rounded-lg p-5 text-sm text-neutral-500">{t.empty}</div>
      ) : (
        <div className="space-y-5">
          {groups.map(([dateKey, dayEntries]) => (
            <div key={dateKey}>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#9a6a00]">{formatDateHeading(dateKey, locale)}</p>
              <div className="grid gap-3">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="surface rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                          {entry.classLabel} • {programLabel(entry.program)}
                        </p>
                        <p className="mt-1 font-bold text-[#1f1f1f]">{entry.titleZh}</p>
                        {entry.titleId ? <p className="mt-0.5 text-sm text-neutral-500">{entry.titleId}</p> : null}
                        <p className="mt-2 text-sm text-neutral-600">
                          {t.instructor}: {entry.instructorName || t.instructorUnset}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm text-neutral-500">
                        {entry.startTime && entry.endTime ? (
                          <p className="font-semibold text-neutral-700">{entry.startTime}–{entry.endTime}</p>
                        ) : null}
                        {entry.duplicateStatus === "POSSIBLE_DUPLICATE" ? (
                          <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Kemungkinan duplikat
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
