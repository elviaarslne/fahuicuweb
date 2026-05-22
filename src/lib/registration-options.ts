export const memberStatusOptions = [
  {
    value: "QIU_DAO_BARU",
    label: "Qiu Dao baru",
    description: "Baru memulai perjalanan dan divisi boleh belum ditentukan.",
  },
  {
    value: "ANGGOTA_LAMA",
    label: "Anggota lama",
    description: "Sudah aktif sebelumnya dan wajib memilih minimal satu divisi.",
  },
] as const;

export type DivisionSeed = {
  id: string;
  slug: string;
  code: string;
  name: string;
  indonesianName: string;
  chineseName: string;
  sortOrder: number;
  isPilot?: boolean;
  subdivisions: Array<{
    id: string;
    slug: string;
    name: string;
    indonesianName: string;
    chineseName: string;
    sortOrder: number;
  }>;
};

export const divisionMasterData: DivisionSeed[] = [
  {
    id: "tao_wu_cu",
    slug: "tao-wu-cu",
    code: "TAO_WU_CU",
    name: "Tao Wu Cu",
    indonesianName: "Divisi Pengembangan Wadah Ketuhanan",
    chineseName: "道務組",
    sortOrder: 1,
    subdivisions: [],
  },
  {
    id: "pan_wu_cu",
    slug: "pan-wu-cu",
    code: "PAN_WU_CU",
    name: "Pan Wu Cu",
    indonesianName: "Divisi Kelas",
    chineseName: "班務組",
    sortOrder: 2,
    subdivisions: [
      { id: "yen_ciu_pan_wu", slug: "yen-ciu-pan-wu", name: "Yen Ciu Pan Wu", indonesianName: "Kurikulum & Penelitian Kelas", chineseName: "研究班務", sortOrder: 1 },
      { id: "ren_chai_xin_lien", slug: "ren-chai-xin-lien", name: "Ren Chai Xin Lien", indonesianName: "Pelatihan Kader", chineseName: "人才訓練", sortOrder: 2 },
      { id: "chen_chien_kui_hua", slug: "chen-chien-kui-hua", name: "Chen Chien Kui Hua", indonesianName: "Perencanaan Penyempurnaan Umat", chineseName: "成全規劃", sortOrder: 3 },
    ],
  },
  {
    id: "fa_hui_cu",
    slug: "fa-hui-cu",
    code: "FA_HUI_CU",
    name: "Fa Hui Cu",
    indonesianName: "Divisi Penataran/Seminar Dharma",
    chineseName: "法會組",
    sortOrder: 3,
    isPilot: true,
    subdivisions: [
      { id: "sheng_ke", slug: "sheng-ke", name: "Sheng Ke", indonesianName: "Lagu Suci", chineseName: "聖歌", sortOrder: 1 },
      { id: "than_wu", slug: "than-wu", name: "Than Wu", indonesianName: "Altar", chineseName: "壇務", sortOrder: 2 },
      { id: "cao_tai", slug: "cao-tai", name: "Cao Tai", indonesianName: "Pelayanan", chineseName: "招待", sortOrder: 3 },
    ],
  },
  {
    id: "huo_tong_cu",
    slug: "huo-tong-cu",
    code: "HUO_TONG_CU",
    name: "Huo Tong Cu",
    indonesianName: "Divisi Kegiatan",
    chineseName: "活動組",
    sortOrder: 4,
    subdivisions: [
      { id: "phai_mai_che_hua", slug: "phai-mai-che-hua", name: "Phai Mai Che Hua", indonesianName: "Perencanaan Lelang", chineseName: "拍賣策劃", sortOrder: 1 },
    ],
  },
  {
    id: "wen_shu_cu",
    slug: "wen-shu-cu",
    code: "WEN_SHU_CU",
    name: "Wen Shu Cu",
    indonesianName: "Divisi Administrasi dan Dokumentasi",
    chineseName: "文書組",
    sortOrder: 5,
    subdivisions: [],
  },
  {
    id: "chai_wu_cu",
    slug: "chai-wu-cu",
    code: "CHAI_WU_CU",
    name: "Chai Wu Cu",
    indonesianName: "Divisi Keuangan",
    chineseName: "財務組",
    sortOrder: 6,
    subdivisions: [
      { id: "khuai_ci_akuntansi", slug: "khuai-ci-akuntansi", name: "Khuai Ci", indonesianName: "Akuntansi", chineseName: "會計", sortOrder: 1 },
      { id: "chu_na", slug: "chu-na", name: "Chu Na", indonesianName: "Bendahara", chineseName: "出納", sortOrder: 2 },
      { id: "ji_he", slug: "ji-he", name: "Ji He", indonesianName: "Audit", chineseName: "稽核", sortOrder: 3 },
    ],
  },
  {
    id: "cong_wu_cu",
    slug: "cong-wu-cu",
    code: "CONG_WU_CU",
    name: "Cong Wu Cu",
    indonesianName: "Divisi Umum",
    chineseName: "總務組",
    sortOrder: 7,
    subdivisions: [],
  },
  {
    id: "ce_sin_cu",
    slug: "ce-sin-cu",
    code: "CE_SIN_CU",
    name: "Ce Sin Cu",
    indonesianName: "Divisi Informasi",
    chineseName: "資訊組",
    sortOrder: 8,
    subdivisions: [],
  },
  {
    id: "tu_cing_cu",
    slug: "tu-cing-cu",
    code: "TU_CING_CU",
    name: "Tu Cing Cu",
    indonesianName: "Divisi Pembacaan Kitab Suci",
    chineseName: "讀經組",
    sortOrder: 9,
    subdivisions: [],
  },
  {
    id: "wen_ciao_cu",
    slug: "wen-ciao-cu",
    code: "WEN_CIAO_CU",
    name: "Wen Ciao Cu",
    indonesianName: "Divisi Sosial & Pendidikan",
    chineseName: "文教組",
    sortOrder: 10,
    subdivisions: [
      { id: "kong_kuan", slug: "kong-kuan", name: "Kong Kuan", indonesianName: "Humas", chineseName: "公關", sortOrder: 1 },
      { id: "ce_kong", slug: "ce-kong", name: "Ce Kong", indonesianName: "Relawan", chineseName: "志工", sortOrder: 2 },
      { id: "huo_tong_pelaksana", slug: "huo-tong-pelaksana", name: "Huo Tong", indonesianName: "Pelaksana Kegiatan", chineseName: "活動", sortOrder: 3 },
      { id: "khuai_ci_hui_wu", slug: "khuai-ci-hui-wu", name: "Khuai Ci", indonesianName: "Keuangan", chineseName: "會務", sortOrder: 4 },
      { id: "ling_cong_kuai_huai", slug: "ling-cong-kuai-huai", name: "Ling Cong Kuai Huai", indonesianName: "Pelayanan Akhir Hayat", chineseName: "臨終關懷", sortOrder: 5 },
    ],
  },
];

export function labelForMemberStatus(value: string | null | undefined) {
  return memberStatusOptions.find((item) => item.value === value)?.label || "Qiu Dao baru";
}
