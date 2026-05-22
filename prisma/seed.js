require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL || ""),
});

const classLevels = [
  ["kelas_1", 1, "Kelas 1 - Fo Gui Li Jie Ban 1", "kelas-1-fo-gui-li-jie-ban-1"],
  ["kelas_2", 2, "Kelas 2 - Fo Gui Li Jie Ban 2", "kelas-2-fo-gui-li-jie-ban-2"],
  ["kelas_3", 3, "Kelas 3 - Jiang Yuan Ban", "kelas-3-jiang-yuan-ban"],
  ["kelas_4", 4, "Kelas 4 - Tan Zhu Ban", "kelas-4-tan-zhu-ban"],
  ["kelas_5", 5, "Kelas 5 - Tan Zhu Ban", "kelas-5-tan-zhu-ban"],
  ["kelas_6", 6, "Kelas 6 - Jiang Shi Ban", "kelas-6-jiang-shi-ban"],
  ["kelas_7", 7, "Kelas 7 - Jiang Shi Ban", "kelas-7-jiang-shi-ban"],
];

const branches = [
  ["pusat", "Pusat", "Pusat", "pusat", true],
  ["sunter", "Sunter", "Kuang Ming Fo Thang", "sunter", false],
  ["grogol", "Grogol", "Kuang Chien Fo Thang", "grogol", false],
  ["teluk_gong", "Teluk Gong", "Kuang Li Fo Thang", "teluk-gong", false],
  ["serpong", "Serpong", "Kuang Yuan Fo Thang", "serpong", false],
];

const divisions = [
  ["tao_wu_cu", "tao-wu-cu", "TAO_WU_CU", "Tao Wu Cu", "Divisi Pengembangan Wadah Ketuhanan", "道務組", 1, false, []],
  ["pan_wu_cu", "pan-wu-cu", "PAN_WU_CU", "Pan Wu Cu", "Divisi Kelas", "班務組", 2, false, [
    ["yen_ciu_pan_wu", "yen-ciu-pan-wu", "Yen Ciu Pan Wu", "Kurikulum & Penelitian Kelas", "研究班務", 1],
    ["ren_chai_xin_lien", "ren-chai-xin-lien", "Ren Chai Xin Lien", "Pelatihan Kader", "人才訓練", 2],
    ["chen_chien_kui_hua", "chen-chien-kui-hua", "Chen Chien Kui Hua", "Perencanaan Penyempurnaan Umat", "成全規劃", 3],
  ]],
  ["fa_hui_cu", "fa-hui-cu", "FA_HUI_CU", "Fa Hui Cu", "Divisi Penataran/Seminar Dharma", "法會組", 3, true, [
    ["sheng_ke", "sheng-ke", "Sheng Ke", "Lagu Suci", "聖歌", 1],
    ["than_wu", "than-wu", "Than Wu", "Altar", "壇務", 2],
    ["cao_tai", "cao-tai", "Cao Tai", "Pelayanan", "招待", 3],
  ]],
  ["huo_tong_cu", "huo-tong-cu", "HUO_TONG_CU", "Huo Tong Cu", "Divisi Kegiatan", "活動組", 4, false, [
    ["phai_mai_che_hua", "phai-mai-che-hua", "Phai Mai Che Hua", "Perencanaan Lelang", "拍賣策劃", 1],
  ]],
  ["wen_shu_cu", "wen-shu-cu", "WEN_SHU_CU", "Wen Shu Cu", "Divisi Administrasi dan Dokumentasi", "文書組", 5, false, []],
  ["chai_wu_cu", "chai-wu-cu", "CHAI_WU_CU", "Chai Wu Cu", "Divisi Keuangan", "財務組", 6, false, [
    ["khuai_ci_akuntansi", "khuai-ci-akuntansi", "Khuai Ci", "Akuntansi", "會計", 1],
    ["chu_na", "chu-na", "Chu Na", "Bendahara", "出納", 2],
    ["ji_he", "ji-he", "Ji He", "Audit", "稽核", 3],
  ]],
  ["cong_wu_cu", "cong-wu-cu", "CONG_WU_CU", "Cong Wu Cu", "Divisi Umum", "總務組", 7, false, []],
  ["ce_sin_cu", "ce-sin-cu", "CE_SIN_CU", "Ce Sin Cu", "Divisi Informasi", "資訊組", 8, false, []],
  ["tu_cing_cu", "tu-cing-cu", "TU_CING_CU", "Tu Cing Cu", "Divisi Pembacaan Kitab Suci", "讀經組", 9, false, []],
  ["wen_ciao_cu", "wen-ciao-cu", "WEN_CIAO_CU", "Wen Ciao Cu", "Divisi Sosial & Pendidikan", "文教組", 10, false, [
    ["kong_kuan", "kong-kuan", "Kong Kuan", "Humas", "公關", 1],
    ["ce_kong", "ce-kong", "Ce Kong", "Relawan", "志工", 2],
    ["huo_tong_pelaksana", "huo-tong-pelaksana", "Huo Tong", "Pelaksana Kegiatan", "活動", 3],
    ["khuai_ci_hui_wu", "khuai-ci-hui-wu", "Khuai Ci", "Keuangan", "會務", 4],
    ["ling_cong_kuai_huai", "ling-cong-kuai-huai", "Ling Cong Kuai Huai", "Pelayanan Akhir Hayat", "臨終關懷", 5],
  ]],
];

const rewards = [
  ["reward_dasi_fo_thang", "Dasi Fo Thang", "Reward perlengkapan Fo Thang untuk kegiatan resmi.", 120],
  ["reward_baju_guang_ji_biru", "Baju Guang Ji Biru", "Baju kegiatan Guang Ji warna biru.", 220],
  ["reward_stoking", "Stoking", "Perlengkapan berpakaian rapi untuk kegiatan Fo Thang.", 60],
  ["reward_kaos_kaki", "Kaos Kaki", "Kaos kaki untuk pelayanan dan kegiatan.", 50],
  ["reward_sepatu_fo_thang", "Sepatu Fo Thang", "Sepatu untuk kegiatan dan pelayanan Fo Thang.", 350],
  ["reward_kemeja_putih", "Kemeja Putih", "Kemeja putih untuk kegiatan resmi.", 180],
  ["reward_rok_fo_thang", "Rok Fo Thang", "Rok untuk kegiatan dan pelayanan Fo Thang.", 180],
];

const learningModules = [
  ["module_qiu_dao_intro", "Pengantar Perjalanan Qiu Dao", "Memahami makna awal perjalanan pembelajaran Dharma dan sikap dasar sebagai anggota.", "kelas_1", 1],
  ["module_fa_hui_role", "Peran Fa Hui Cu dalam Sidang Dharma", "Mengenal fungsi Fa Hui Cu sebagai Seksi Sidang Dharma dan alur pelayanan acara.", null, 2],
  ["module_refleksi_diri", "Refleksi Diri Setelah Kegiatan", "Latihan menuliskan pembelajaran, manfaat, dan perbaikan diri setelah mengikuti kegiatan.", null, 3],
];

async function main() {
  for (const [id, name, foThangName, slug, isCenter] of branches) {
    await prisma.branch.upsert({
      where: { id },
      update: { name, foThangName, slug, isCenter },
      create: { id, name, foThangName, slug, isCenter },
    });
  }

  for (const [id, levelNumber, name, slug] of classLevels) {
    await prisma.classLevel.upsert({
      where: { levelNumber },
      update: { name, slug },
      create: { id, levelNumber, name, slug },
    });
  }

  for (const [id, slug, code, name, indonesianName, chineseName, sortOrder, isPilot, subdivisions] of divisions) {
    await prisma.division.upsert({
      where: { id },
      update: { slug, code, name, indonesianName, chineseName, sortOrder, isPilot },
      create: { id, slug, code, name, indonesianName, chineseName, sortOrder, isPilot },
    });

    for (const [subId, subSlug, subName, subIndonesianName, subChineseName, subSortOrder] of subdivisions) {
      await prisma.subdivision.upsert({
        where: { id: subId },
        update: {
          divisionId: id,
          slug: subSlug,
          name: subName,
          indonesianName: subIndonesianName,
          chineseName: subChineseName,
          sortOrder: subSortOrder,
        },
        create: {
          id: subId,
          divisionId: id,
          slug: subSlug,
          name: subName,
          indonesianName: subIndonesianName,
          chineseName: subChineseName,
          sortOrder: subSortOrder,
        },
      });
    }
  }

  for (const [id, name, description, creditPrice] of rewards) {
    await prisma.reward.upsert({
      where: { id },
      update: { name, description, creditPrice, isActive: true },
      create: { id, name, description, creditPrice, isActive: true },
    });
  }

  for (const [id, title, description, classLevelId, orderNumber] of learningModules) {
    await prisma.learningModule.upsert({
      where: { id },
      update: { title, description, classLevelId, orderNumber, isActive: true },
      create: { id, title, description, classLevelId, orderNumber, isActive: true },
    });
  }

  await prisma.dailyWejangan.upsert({
    where: { id: "wejangan_awal_fahuicu" },
    update: {
      title: "Menata Hati Sebelum Melayani",
      source: "Buddha Hidup Ci Kong",
      content: "Pelayanan Dharma dimulai dari hati yang tenang, tutur kata yang lembut, dan niat yang lurus untuk membantu sesama bertumbuh.",
      reflectionQuestion: "Apa satu sikap yang ingin kamu latih hari ini dalam pelayanan atau pembelajaran?",
      creditReward: 10,
    },
    create: {
      id: "wejangan_awal_fahuicu",
      title: "Menata Hati Sebelum Melayani",
      source: "Buddha Hidup Ci Kong",
      uploadDate: new Date(),
      content: "Pelayanan Dharma dimulai dari hati yang tenang, tutur kata yang lembut, dan niat yang lurus untuk membantu sesama bertumbuh.",
      reflectionQuestion: "Apa satu sikap yang ingin kamu latih hari ini dalam pelayanan atau pembelajaran?",
      creditReward: 10,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
