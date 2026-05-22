export const classLevels = [
  { level: 1, name: "Fo Gui Li Jie Ban 1", members: 38 },
  { level: 2, name: "Fo Gui Li Jie Ban 2", members: 31 },
  { level: 3, name: "Jiang Yuan Ban", members: 24 },
  { level: 4, name: "Tan Zhu Ban", members: 18 },
  { level: 5, name: "Tan Zhu Ban", members: 16 },
  { level: 6, name: "Jiang Shi Ban", members: 12 },
  { level: 7, name: "Jiang Shi Ban", members: 9 },
];

export const events = [
  {
    title: "Pelatihan Dharma Internal",
    type: "Training",
    date: "24 Mei 2026",
    status: "Published",
    target: "Kelas 3",
    attendance: 86,
    purposeScore: 4.4,
  },
  {
    title: "Dharma Assembly Bulanan",
    type: "Dharma Assembly",
    date: "31 Mei 2026",
    status: "Draft",
    target: "Semua kelas",
    attendance: 0,
    purposeScore: 0,
  },
  {
    title: "Pembekalan MC dan Koordinator",
    type: "Training",
    date: "7 Juni 2026",
    status: "Published",
    target: "Fa Hui Cu",
    attendance: 72,
    purposeScore: 4.1,
  },
];

export const members = [
  { name: "Agus Santoso", chineseName: "陳明德", className: "Kelas 3", status: "Active", role: "Koordinator eligible" },
  { name: "Mei Lestari", chineseName: "林慧珍", className: "Kelas 6", status: "Active", role: "Speaker" },
  { name: "Budi Hartono", chineseName: "", className: "Kelas 1", status: "Pending", role: "Member" },
  { name: "Santi Wijaya", chineseName: "黃淑芬", className: "Kelas 4", status: "Active", role: "Trainer" },
];

export const feedbackItems = [
  { event: "Pelatihan Dharma Internal", purpose: 4.4, clarity: 4.2, usefulness: 4.6, risk: "Baik" },
  { event: "Kelas Pemantapan Tan Zhu", purpose: 3.2, clarity: 3.5, usefulness: 3.8, risk: "Perlu tindak lanjut" },
  { event: "Dharma Assembly Remaja", purpose: 4.7, clarity: 4.5, usefulness: 4.8, risk: "Sangat baik" },
];
