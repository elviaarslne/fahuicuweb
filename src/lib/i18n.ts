export type Locale = "id" | "zh-TW";

export const languageOptions = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "zh-TW", label: "中文（繁體）" },
] as const;

export const dictionary = {
  id: {
    nav: {
      home: "Home",
      members: "Anggota",
      classes: "Kelas",
      events: "Sidang Dharma",
      sidangDharma: "Sidang Dharma",
      trainingAdmin: "Training",
      classBanWuCu: "Kelas / Ban Wu Cu",
      approval: "Approval Center",
      activityMonitor: "Moments Monitor",
      attendance: "Attendance",
      feedback: "Evaluasi",
      materials: "Materi",
      myClass: "Kelas Saya",
      learningModules: "Modul Pembelajaran",
      dailyWejangan: "Wejangan Harian",
      training: "Training",
      activity: "Moments",
      store: "Store",
      settings: "Settings",
      adminWejangan: "Kelola Wejangan",
      adminModules: "Kelola Modul",
      adminRewards: "Kelola Store",
      adminActivity: "Monitor Moments",
    },
    settings: {
      title: "Pengaturan",
      akun: "Akun",
      profil: "Profil",
      keamanan: "Keamanan",
      preferensi: "Preferensi",
      bahasa: "Bahasa",
      workspace: "Workspace",
      aktivitas: "Aktivitas",
      ringkasan: "Ringkasan",
    },
  },
  "zh-TW": {
    nav: {
      home: "首頁",
      members: "會員",
      classes: "班級",
      events: "法會 2026",
      sidangDharma: "法會",
      trainingAdmin: "培訓",
      classBanWuCu: "班務處 / 班級",
      approval: "審核中心",
      activityMonitor: "瞬間監控",
      attendance: "出席",
      feedback: "回饋",
      materials: "教材",
      myClass: "我的班級",
      learningModules: "學習模組",
      dailyWejangan: "每日聖訓",
      training: "訓練",
      activity: "瞬間",
      store: "兌換商店",
      settings: "設定",
      adminWejangan: "管理聖訓",
      adminModules: "管理模組",
      adminRewards: "管理商店",
      adminActivity: "瞬間監控",
    },
    settings: {
      title: "設定",
      akun: "帳戶",
      profil: "個人資料",
      keamanan: "安全",
      preferensi: "偏好設定",
      bahasa: "語言",
      workspace: "工作區",
      aktivitas: "活動",
      ringkasan: "摘要",
    },
  },
} as const;

export function normalizeLocale(value?: string | null): Locale {
  if (value === "zh_TW" || value === "zh-TW") return "zh-TW";
  return "id";
}

export function prismaLanguage(value: Locale) {
  return value === "zh-TW" ? "zh_TW" : "id";
}
