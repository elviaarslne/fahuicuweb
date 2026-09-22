-- Manual Schedule (2026 workbook) table creation only.
-- Review before applying to the existing fahuicu_system database.
-- This file creates only the schedule_entries table and does not modify
-- legacy tables. `db push` was intentionally not used for this addition:
-- it detected pre-existing, unrelated drift on `users`/`events` (orphaned
-- legacy columns, varchar length differences) that predates this change
-- and would require --accept-data-loss to proceed, which is out of scope
-- here and was not applied.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `schedule_entries` (
  `id` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `title_zh` TEXT NOT NULL,
  `title_id` TEXT NULL,
  `instructor_name` VARCHAR(191) NULL,
  `program` ENUM('KUANG_MING', 'KUANG_CHIEN', 'ONLINE', 'XUE_SHENG_KUANG_MING', 'XUE_SHENG_KUANG_CHIEN') NOT NULL,
  `class_label` VARCHAR(191) NOT NULL,
  `start_time` VARCHAR(191) NULL,
  `end_time` VARCHAR(191) NULL,
  `source_sheet` VARCHAR(191) NOT NULL,
  `source_row` INTEGER NOT NULL,
  `duplicate_status` ENUM('NORMAL', 'POSSIBLE_DUPLICATE') NOT NULL DEFAULT 'NORMAL',
  `linked_event_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `schedule_entries_source_sheet_source_row_key` (`source_sheet`, `source_row`),
  INDEX `schedule_entries_date_idx` (`date`),
  INDEX `schedule_entries_program_idx` (`program`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
