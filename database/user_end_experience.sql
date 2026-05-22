CREATE TABLE IF NOT EXISTS event_sessions (
  id VARCHAR(191) NOT NULL,
  event_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  start_at DATETIME(3) NULL,
  end_at DATETIME(3) NULL,
  speaker_id VARCHAR(191) NULL,
  trainer_id VARCHAR(191) NULL,
  order_number INT NOT NULL DEFAULT 0,
  material_url VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX event_sessions_event_id_idx (event_id),
  INDEX event_sessions_speaker_id_idx (speaker_id),
  INDEX event_sessions_trainer_id_idx (trainer_id),
  CONSTRAINT event_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_sessions_speaker_id_fkey FOREIGN KEY (speaker_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT event_sessions_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topic_feedbacks (
  id VARCHAR(191) NOT NULL,
  event_session_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  speaker_clarity_rating INT NOT NULL,
  material_usefulness_rating INT NOT NULL,
  topic_relevance_rating INT NOT NULL,
  learned_text TEXT NOT NULL,
  benefit_text TEXT NOT NULL,
  improvement_text TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY topic_feedbacks_event_session_id_user_id_key (event_session_id, user_id),
  INDEX topic_feedbacks_user_id_idx (user_id),
  CONSTRAINT topic_feedbacks_event_session_id_fkey FOREIGN KEY (event_session_id) REFERENCES event_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT topic_feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_reflections (
  id VARCHAR(191) NOT NULL,
  event_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  overall_impression TEXT NOT NULL,
  main_learning TEXT NOT NULL,
  suggestion TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY event_reflections_event_id_user_id_key (event_id, user_id),
  INDEX event_reflections_user_id_idx (user_id),
  CONSTRAINT event_reflections_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_modules (
  id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  class_level_id VARCHAR(191) NULL,
  order_number INT NOT NULL DEFAULT 0,
  material_url VARCHAR(191) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX learning_modules_class_level_id_idx (class_level_id),
  CONSTRAINT learning_modules_class_level_id_fkey FOREIGN KEY (class_level_id) REFERENCES class_levels(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_module_progress (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  module_id VARCHAR(191) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at DATETIME(3) NULL,
  notes TEXT NULL,
  photo_url VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY learning_module_progress_user_id_module_id_key (user_id, module_id),
  INDEX learning_module_progress_module_id_idx (module_id),
  CONSTRAINT learning_module_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT learning_module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_wejangan (
  id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  source VARCHAR(191) NULL,
  upload_date DATETIME(3) NOT NULL,
  content TEXT NOT NULL,
  reflection_question TEXT NULL,
  credit_reward INT NOT NULL DEFAULT 10,
  created_by_admin_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX daily_wejangan_upload_date_idx (upload_date),
  INDEX daily_wejangan_created_by_admin_id_idx (created_by_admin_id),
  CONSTRAINT daily_wejangan_created_by_admin_id_fkey FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wejangan_reflections (
  id VARCHAR(191) NOT NULL,
  wejangan_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  answer TEXT NOT NULL,
  credit_awarded INT NOT NULL DEFAULT 10,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY wejangan_reflections_wejangan_id_user_id_key (wejangan_id, user_id),
  INDEX wejangan_reflections_user_id_idx (user_id),
  CONSTRAINT wejangan_reflections_wejangan_id_fkey FOREIGN KEY (wejangan_id) REFERENCES daily_wejangan(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT wejangan_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_posts (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  caption TEXT NOT NULL,
  image_url VARCHAR(191) NULL,
  type ENUM('EVENT_PHOTO', 'LEARNING_PROGRESS', 'GRATITUDE', 'OTHER') NOT NULL DEFAULT 'OTHER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX activity_posts_user_id_idx (user_id),
  INDEX activity_posts_type_idx (type),
  CONSTRAINT activity_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rewards (
  id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(191) NULL,
  credit_price INT NOT NULL,
  stock INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reward_transactions (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  reward_id VARCHAR(191) NOT NULL,
  credit_cost INT NOT NULL,
  status ENUM('REQUESTED', 'APPROVED', 'FULFILLED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX reward_transactions_user_id_idx (user_id),
  INDEX reward_transactions_reward_id_idx (reward_id),
  CONSTRAINT reward_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT reward_transactions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO rewards (id, name, description, image_url, credit_price, stock, is_active)
VALUES
  ('reward_dasi_fo_thang', 'Dasi Fo Thang', 'Reward perlengkapan Fo Thang untuk kegiatan resmi.', NULL, 120, NULL, TRUE),
  ('reward_baju_guang_ji_biru', 'Baju Guang Ji Biru', 'Baju kegiatan Guang Ji warna biru.', NULL, 220, NULL, TRUE),
  ('reward_stoking', 'Stoking', 'Perlengkapan berpakaian rapi untuk kegiatan Fo Thang.', NULL, 60, NULL, TRUE),
  ('reward_kaos_kaki', 'Kaos Kaki', 'Kaos kaki untuk pelayanan dan kegiatan.', NULL, 50, NULL, TRUE),
  ('reward_sepatu_fo_thang', 'Sepatu Fo Thang', 'Sepatu untuk kegiatan dan pelayanan Fo Thang.', NULL, 350, NULL, TRUE),
  ('reward_kemeja_putih', 'Kemeja Putih', 'Kemeja putih untuk kegiatan resmi.', NULL, 180, NULL, TRUE),
  ('reward_rok_fo_thang', 'Rok Fo Thang', 'Rok untuk kegiatan dan pelayanan Fo Thang.', NULL, 180, NULL, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  credit_price = VALUES(credit_price),
  is_active = VALUES(is_active);

INSERT INTO daily_wejangan (id, title, source, upload_date, content, reflection_question, credit_reward)
VALUES
  ('wejangan_awal_fahuicu', 'Menata Hati Sebelum Melayani', 'Buddha Hidup Ci Kong', CURRENT_TIMESTAMP(3), 'Pelayanan Dharma dimulai dari hati yang tenang, tutur kata yang lembut, dan niat yang lurus untuk membantu sesama bertumbuh.', 'Apa satu sikap yang ingin kamu latih hari ini dalam pelayanan atau pembelajaran?', 10)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  source = VALUES(source),
  content = VALUES(content),
  reflection_question = VALUES(reflection_question),
  credit_reward = VALUES(credit_reward);

INSERT INTO learning_modules (id, title, description, class_level_id, order_number, material_url, is_active)
VALUES
  ('module_qiu_dao_intro', 'Pengantar Perjalanan Qiu Dao', 'Memahami makna awal perjalanan pembelajaran Dharma dan sikap dasar sebagai anggota.', 'kelas_1', 1, NULL, TRUE),
  ('module_fa_hui_role', 'Peran Fa Hui Cu dalam Sidang Dharma', 'Mengenal fungsi Fa Hui Cu sebagai Seksi Sidang Dharma dan alur pelayanan acara.', NULL, 2, NULL, TRUE),
  ('module_refleksi_diri', 'Refleksi Diri Setelah Kegiatan', 'Latihan menuliskan pembelajaran, manfaat, dan perbaikan diri setelah mengikuti kegiatan.', NULL, 3, NULL, TRUE)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  class_level_id = VALUES(class_level_id),
  order_number = VALUES(order_number),
  is_active = VALUES(is_active);
