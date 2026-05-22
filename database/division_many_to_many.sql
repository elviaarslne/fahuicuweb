CREATE TABLE IF NOT EXISTS divisions (
  id VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  code VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  indonesian_name VARCHAR(191) NOT NULL,
  chinese_name VARCHAR(191) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_pilot BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY divisions_slug_key (slug)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subdivisions (
  id VARCHAR(191) NOT NULL,
  division_id VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  indonesian_name VARCHAR(191) NOT NULL,
  chinese_name VARCHAR(191) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY subdivisions_slug_key (slug),
  KEY subdivisions_division_id_idx (division_id),
  CONSTRAINT subdivisions_division_id_fkey FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_divisions (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  division_id VARCHAR(191) NOT NULL,
  subdivision_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY user_divisions_user_id_idx (user_id),
  KEY user_divisions_division_id_idx (division_id),
  KEY user_divisions_subdivision_id_idx (subdivision_id),
  CONSTRAINT user_divisions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT user_divisions_division_id_fkey FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT user_divisions_subdivision_id_fkey FOREIGN KEY (subdivision_id) REFERENCES subdivisions(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO divisions (id, slug, code, name, indonesian_name, chinese_name, sort_order, is_pilot) VALUES
('tao_wu_cu','tao-wu-cu','TAO_WU_CU','Tao Wu Cu','Divisi Pengembangan Wadah Ketuhanan','道務組',1,false),
('pan_wu_cu','pan-wu-cu','PAN_WU_CU','Pan Wu Cu','Divisi Kelas','班務組',2,false),
('fa_hui_cu','fa-hui-cu','FA_HUI_CU','Fa Hui Cu','Divisi Penataran/Seminar Dharma','法會組',3,true),
('huo_tong_cu','huo-tong-cu','HUO_TONG_CU','Huo Tong Cu','Divisi Kegiatan','活動組',4,false),
('wen_shu_cu','wen-shu-cu','WEN_SHU_CU','Wen Shu Cu','Divisi Administrasi dan Dokumentasi','文書組',5,false),
('chai_wu_cu','chai-wu-cu','CHAI_WU_CU','Chai Wu Cu','Divisi Keuangan','財務組',6,false),
('cong_wu_cu','cong-wu-cu','CONG_WU_CU','Cong Wu Cu','Divisi Umum','總務組',7,false),
('ce_sin_cu','ce-sin-cu','CE_SIN_CU','Ce Sin Cu','Divisi Informasi','資訊組',8,false),
('tu_cing_cu','tu-cing-cu','TU_CING_CU','Tu Cing Cu','Divisi Pembacaan Kitab Suci','讀經組',9,false),
('wen_ciao_cu','wen-ciao-cu','WEN_CIAO_CU','Wen Ciao Cu','Divisi Sosial & Pendidikan','文教組',10,false)
ON DUPLICATE KEY UPDATE
  slug = VALUES(slug),
  code = VALUES(code),
  name = VALUES(name),
  indonesian_name = VALUES(indonesian_name),
  chinese_name = VALUES(chinese_name),
  sort_order = VALUES(sort_order),
  is_pilot = VALUES(is_pilot);

INSERT INTO subdivisions (id, division_id, slug, name, indonesian_name, chinese_name, sort_order) VALUES
('yen_ciu_pan_wu','pan_wu_cu','yen-ciu-pan-wu','Yen Ciu Pan Wu','Kurikulum & Penelitian Kelas','研究班務',1),
('ren_chai_xin_lien','pan_wu_cu','ren-chai-xin-lien','Ren Chai Xin Lien','Pelatihan Kader','人才訓練',2),
('chen_chien_kui_hua','pan_wu_cu','chen-chien-kui-hua','Chen Chien Kui Hua','Perencanaan Penyempurnaan Umat','成全規劃',3),
('sheng_ke','fa_hui_cu','sheng-ke','Sheng Ke','Lagu Suci','聖歌',1),
('than_wu','fa_hui_cu','than-wu','Than Wu','Altar','壇務',2),
('cao_tai','fa_hui_cu','cao-tai','Cao Tai','Pelayanan','招待',3),
('phai_mai_che_hua','huo_tong_cu','phai-mai-che-hua','Phai Mai Che Hua','Perencanaan Lelang','拍賣策劃',1),
('khuai_ci_akuntansi','chai_wu_cu','khuai-ci-akuntansi','Khuai Ci','Akuntansi','會計',1),
('chu_na','chai_wu_cu','chu-na','Chu Na','Bendahara','出納',2),
('ji_he','chai_wu_cu','ji-he','Ji He','Audit','稽核',3),
('kong_kuan','wen_ciao_cu','kong-kuan','Kong Kuan','Humas','公關',1),
('ce_kong','wen_ciao_cu','ce-kong','Ce Kong','Relawan','志工',2),
('huo_tong_pelaksana','wen_ciao_cu','huo-tong-pelaksana','Huo Tong','Pelaksana Kegiatan','活動',3),
('khuai_ci_hui_wu','wen_ciao_cu','khuai-ci-hui-wu','Khuai Ci','Keuangan','會務',4),
('ling_cong_kuai_huai','wen_ciao_cu','ling-cong-kuai-huai','Ling Cong Kuai Huai','Pelayanan Akhir Hayat','臨終關懷',5)
ON DUPLICATE KEY UPDATE
  division_id = VALUES(division_id),
  slug = VALUES(slug),
  name = VALUES(name),
  indonesian_name = VALUES(indonesian_name),
  chinese_name = VALUES(chinese_name),
  sort_order = VALUES(sort_order);

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_fhc_', id), id, 'fa_hui_cu', NULL
FROM users
WHERE division = 'FA_HUI_CU'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.division_id = 'fa_hui_cu' AND ud.subdivision_id IS NULL);

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_than_', id), id, 'fa_hui_cu', 'than_wu'
FROM users
WHERE division = 'THAN_WU_ALTAR'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.subdivision_id = 'than_wu');

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_cao_', id), id, 'fa_hui_cu', 'cao_tai'
FROM users
WHERE division = 'CAO_TAI_PELAYANAN'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.subdivision_id = 'cao_tai');

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_sheng_', id), id, 'fa_hui_cu', 'sheng_ke'
FROM users
WHERE division = 'CIAO_KE_LAGU_SUCI'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.subdivision_id = 'sheng_ke');

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_train_', id), id, 'pan_wu_cu', 'ren_chai_xin_lien'
FROM users
WHERE division = 'PELATIHAN'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.subdivision_id = 'ren_chai_xin_lien');

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_info_', id), id, 'ce_sin_cu', NULL
FROM users
WHERE division = 'DATA_ANALYSIS'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.division_id = 'ce_sin_cu' AND ud.subdivision_id IS NULL);

INSERT INTO user_divisions (id, user_id, division_id, subdivision_id)
SELECT CONCAT('legacy_support_', id), id, 'cong_wu_cu', NULL
FROM users
WHERE division = 'SUPPORT'
  AND NOT EXISTS (SELECT 1 FROM user_divisions ud WHERE ud.user_id = users.id AND ud.division_id = 'cong_wu_cu' AND ud.subdivision_id IS NULL);
