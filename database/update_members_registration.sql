USE fahuicu_system;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500) NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS qiu_dao_card_url VARCHAR(500) NULL AFTER profile_photo_url,
  ADD COLUMN IF NOT EXISTS member_category ENUM('BAN_SHI_JEN_YUAN', 'JIANG_YUAN', 'TAN_ZHU', 'JIANG_SHI') NULL AFTER qiu_dao_card_url;

INSERT INTO users (
  id,
  full_name,
  chinese_name,
  email,
  phone,
  password_hash,
  profile_photo_url,
  qiu_dao_card_url,
  member_category,
  current_class_id,
  status,
  is_coordinator_eligible
)
VALUES (
  'admin_fahuicu',
  'Admin Fa Hui Cu',
  NULL,
  'admin@fahuicu.org',
  NULL,
  '$2b$10$NT2TU3oA4U7BOlAkf/6ZaeeQy7UOpkKsLCerevrbMhSCb//Rhb.Zy',
  NULL,
  NULL,
  NULL,
  NULL,
  'ACTIVE',
  TRUE
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  status = VALUES(status),
  is_coordinator_eligible = VALUES(is_coordinator_eligible),
  updated_at = CURRENT_TIMESTAMP(3);

INSERT INTO user_system_roles (id, user_id, role)
VALUES
  ('admin_fahuicu_role_admin', 'admin_fahuicu', 'ADMIN'),
  ('admin_fahuicu_role_member', 'admin_fahuicu', 'MEMBER')
ON DUPLICATE KEY UPDATE role = VALUES(role);
