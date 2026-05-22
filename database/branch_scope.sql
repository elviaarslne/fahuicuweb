USE fahuicu_system;

CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  fo_thang_name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  is_center BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY branches_slug_key (slug)
);

INSERT INTO branches (id, name, fo_thang_name, slug, is_center)
VALUES
  ('pusat', 'PUSAT', 'Pusat Guang Ming', 'pusat', TRUE),
  ('sunter', 'Sunter', 'Kuang Ming Fo Thang', 'sunter', FALSE),
  ('grogol', 'Grogol', 'Kuang Chien Fo Thang', 'grogol', FALSE),
  ('teluk_gong', 'Teluk Gong', 'Kuang Li Fo Thang', 'teluk-gong', FALSE),
  ('serpong', 'Serpong', 'Kuang Yuan Fo Thang', 'serpong', FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  fo_thang_name = VALUES(fo_thang_name),
  slug = VALUES(slug),
  is_center = VALUES(is_center);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS branch_id VARCHAR(191) NOT NULL DEFAULT 'pusat';

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS branch_id VARCHAR(191) NOT NULL DEFAULT 'pusat';

CREATE INDEX IF NOT EXISTS users_branch_id_idx ON users(branch_id);
CREATE INDEX IF NOT EXISTS events_branch_id_idx ON events(branch_id);

ALTER TABLE user_system_roles
  MODIFY role ENUM('MEMBER', 'ADMIN', 'SUPER_ADMIN', 'KETUA', 'SUB_KETUA', 'TRAINER', 'SPEAKER') NOT NULL;

INSERT IGNORE INTO user_system_roles (id, user_id, role, created_at)
VALUES ('admin_fahuicu_super_admin', 'admin_fahuicu', 'SUPER_ADMIN', NOW(3));

UPDATE users SET branch_id = 'pusat' WHERE branch_id IS NULL OR branch_id = '';
UPDATE events SET branch_id = 'pusat' WHERE branch_id IS NULL OR branch_id = '';
