CREATE TABLE IF NOT EXISTS credit_ledger (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  type ENUM('EARNED', 'SPENT', 'ADJUSTED') NOT NULL,
  source ENUM('WEJANGAN_REFLECTION', 'DAILY_TASK', 'STORE_REDEEM', 'MANUAL_ADMIN', 'EVENT_TASK') NOT NULL,
  amount INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  reference_id VARCHAR(191) NULL,
  note TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX credit_ledger_user_id_idx (user_id),
  INDEX credit_ledger_source_idx (source),
  INDEX credit_ledger_reference_id_idx (reference_id),
  CONSTRAINT credit_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
