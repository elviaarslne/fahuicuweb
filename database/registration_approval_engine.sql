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
  ('pusat', 'Pusat', 'Pusat', 'pusat', TRUE),
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
  ADD COLUMN IF NOT EXISTS home_branch_id VARCHAR(191) NOT NULL DEFAULT 'pusat';

UPDATE users
SET home_branch_id = COALESCE(NULLIF(branch_id, ''), 'pusat')
WHERE home_branch_id = 'pusat' AND EXISTS (
  SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'branch_id'
);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS hosting_branch_id VARCHAR(191) NOT NULL DEFAULT 'pusat',
  ADD COLUMN IF NOT EXISTS minimum_participants INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE events
SET hosting_branch_id = COALESCE(NULLIF(branch_id, ''), 'pusat')
WHERE hosting_branch_id = 'pusat' AND EXISTS (
  SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = 'branch_id'
);

ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS registration_status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS approved_by_user_id VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS approved_at DATETIME(3) NULL;

ALTER TABLE event_participants
  MODIFY attendance_status ENUM('REGISTERED', 'NOT_CHECKED_IN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'NOT_CHECKED_IN';

ALTER TABLE event_attendances
  MODIFY status ENUM('REGISTERED', 'NOT_CHECKED_IN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'NOT_CHECKED_IN';

UPDATE event_participants SET attendance_status = 'NOT_CHECKED_IN' WHERE attendance_status = 'REGISTERED';
UPDATE event_attendances SET status = 'NOT_CHECKED_IN' WHERE status = 'REGISTERED';

ALTER TABLE event_participants
  MODIFY attendance_status ENUM('NOT_CHECKED_IN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'NOT_CHECKED_IN';

ALTER TABLE event_attendances
  MODIFY status ENUM('NOT_CHECKED_IN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'NOT_CHECKED_IN';

CREATE INDEX IF NOT EXISTS users_home_branch_id_idx ON users(home_branch_id);
CREATE INDEX IF NOT EXISTS events_hosting_branch_id_idx ON events(hosting_branch_id);
CREATE INDEX IF NOT EXISTS event_participants_registration_status_idx ON event_participants(registration_status);

ALTER TABLE user_system_roles
  MODIFY role ENUM('MEMBER', 'ADMIN', 'SUPER_ADMIN', 'KETUA', 'SUB_KETUA', 'TRAINER', 'SPEAKER') NOT NULL;

INSERT IGNORE INTO user_system_roles (id, user_id, role, created_at)
VALUES ('admin_fahuicu_super_admin', 'admin_fahuicu', 'SUPER_ADMIN', NOW(3));

UPDATE event_participants
SET registration_status = 'APPROVED'
WHERE registration_status IS NULL;
