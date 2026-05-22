export const feedbackScaleOptions = [1, 2, 3, 4, 5];

export const objectiveFeedbackItems = [
  { name: "materialPurposeRating", label: "Materi sesuai tujuan acara" },
  { name: "deliveryClarityRating", label: "Penyampaian jelas" },
  { name: "timeEffectivenessRating", label: "Waktu efektif" },
  { name: "flowClarityRating", label: "Alur acara jelas" },
] as const;

export const transformationFeedbackItems = [
  { name: "perspectiveChangeRating", label: "Mengubah perspektif / pemahaman" },
  { name: "joinAgainRating", label: "Ingin mengikuti lagi" },
  { name: "understandingRating", label: "Topik lebih dipahami" },
] as const;

export const operationalFeedbackItems = [
  { name: "registrationEaseRating", label: "Registrasi mudah" },
  { name: "coordinationClarityRating", label: "Koordinasi jelas" },
  { name: "locationComfortRating", label: "Lokasi nyaman" },
] as const;

export function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) return null;
  return Number((valid.reduce((total, value) => total + value, 0) / valid.length).toFixed(1));
}
