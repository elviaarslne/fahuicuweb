// Mirrors the SHEET_CONFIG table in scripts/import-2026-schedule.js. Keep
// the program labels here in sync with that script's confirmed mapping.

export const scheduleProgramOptions = [
  { value: "KUANG_MING", label: "Kuang Ming" },
  { value: "KUANG_CHIEN", label: "Kuang Chien" },
  { value: "ONLINE", label: "Online" },
  { value: "XUE_SHENG_KUANG_MING", label: "Xue Sheng Kuang Ming" },
  { value: "XUE_SHENG_KUANG_CHIEN", label: "Xue Sheng Kuang Chien" },
] as const;

export type ScheduleProgramValue = (typeof scheduleProgramOptions)[number]["value"];

export function getScheduleProgramLabel(value: string) {
  return scheduleProgramOptions.find((item) => item.value === value)?.label || value;
}
