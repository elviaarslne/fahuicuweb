USE fahuicu_system;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credit_balance INT NOT NULL DEFAULT 0 AFTER member_category;

UPDATE users
SET credit_balance = 120
WHERE id = 'admin_fahuicu';
