-- Manual Training V1 table creation only.
-- Review before applying to the existing fahuicu_system database.
-- This file creates only training_* tables and does not modify legacy tables.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `training_programs` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `purpose` TEXT NULL,
  `expected_outcome` TEXT NULL,
  `created_by_user_id` VARCHAR(191) NOT NULL,
  `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `training_programs_created_by_user_id_idx` (`created_by_user_id`),
  CONSTRAINT `training_programs_created_by_user_id_fkey`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_batches` (
  `id` VARCHAR(191) NOT NULL,
  `training_program_id` VARCHAR(191) NOT NULL,
  `hosting_branch_id` VARCHAR(191) NULL,
  `title` VARCHAR(191) NOT NULL,
  `batch_code` VARCHAR(191) NULL,
  `start_date` DATETIME(3) NOT NULL,
  `end_date` DATETIME(3) NOT NULL,
  `registration_open_at` DATETIME(3) NULL,
  `registration_close_at` DATETIME(3) NULL,
  `capacity` INTEGER NULL,
  `status` ENUM('DRAFT', 'ENROLLMENT_OPEN', 'ENROLLMENT_CLOSED', 'ONGOING', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `training_batches_training_program_id_idx` (`training_program_id`),
  INDEX `training_batches_hosting_branch_id_idx` (`hosting_branch_id`),
  CONSTRAINT `training_batches_training_program_id_fkey`
    FOREIGN KEY (`training_program_id`) REFERENCES `training_programs`(`id`),
  CONSTRAINT `training_batches_hosting_branch_id_fkey`
    FOREIGN KEY (`hosting_branch_id`) REFERENCES `branches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `training_batch_id` VARCHAR(191) NOT NULL,
  `trainer_id` VARCHAR(191) NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `start_at` DATETIME(3) NOT NULL,
  `end_at` DATETIME(3) NOT NULL,
  `location` VARCHAR(191) NULL,
  `material_url` VARCHAR(191) NULL,
  `order_number` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `training_sessions_training_batch_id_idx` (`training_batch_id`),
  INDEX `training_sessions_trainer_id_idx` (`trainer_id`),
  CONSTRAINT `training_sessions_training_batch_id_fkey`
    FOREIGN KEY (`training_batch_id`) REFERENCES `training_batches`(`id`),
  CONSTRAINT `training_sessions_trainer_id_fkey`
    FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_enrollments` (
  `id` VARCHAR(191) NOT NULL,
  `training_batch_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `status` ENUM('ENROLLED', 'CANCELLED', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'ENROLLED',
  `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` DATETIME(3) NULL,
  `final_score` DOUBLE NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `training_enrollments_training_batch_id_user_id_key` (`training_batch_id`, `user_id`),
  INDEX `training_enrollments_user_id_idx` (`user_id`),
  CONSTRAINT `training_enrollments_training_batch_id_fkey`
    FOREIGN KEY (`training_batch_id`) REFERENCES `training_batches`(`id`),
  CONSTRAINT `training_enrollments_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_attendances` (
  `id` VARCHAR(191) NOT NULL,
  `training_session_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `status` ENUM('NOT_CHECKED_IN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'NOT_CHECKED_IN',
  `checked_in_at` DATETIME(3) NULL,
  `corrected_by_user_id` VARCHAR(191) NULL,
  `correction_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `training_attendances_training_session_id_user_id_key` (`training_session_id`, `user_id`),
  INDEX `training_attendances_user_id_idx` (`user_id`),
  INDEX `training_attendances_corrected_by_user_id_idx` (`corrected_by_user_id`),
  CONSTRAINT `training_attendances_training_session_id_fkey`
    FOREIGN KEY (`training_session_id`) REFERENCES `training_sessions`(`id`),
  CONSTRAINT `training_attendances_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  CONSTRAINT `training_attendances_corrected_by_user_id_fkey`
    FOREIGN KEY (`corrected_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_eligibility_rules` (
  `id` VARCHAR(191) NOT NULL,
  `training_batch_id` VARCHAR(191) NOT NULL,
  `type` ENUM('AGE', 'CLASS_LEVEL', 'HIERARCHY_ROLE', 'SYSTEM_ROLE', 'DIVISION', 'MANUAL_USER') NOT NULL,
  `operator` VARCHAR(191) NULL,
  `value` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `training_eligibility_rules_training_batch_id_idx` (`training_batch_id`),
  CONSTRAINT `training_eligibility_rules_training_batch_id_fkey`
    FOREIGN KEY (`training_batch_id`) REFERENCES `training_batches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_completion_rules` (
  `id` VARCHAR(191) NOT NULL,
  `training_batch_id` VARCHAR(191) NOT NULL,
  `minimum_attendance_percent` INTEGER NOT NULL DEFAULT 80,
  `assignment_weight` INTEGER NULL,
  `exam_weight` INTEGER NULL,
  `minimum_passing_score` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `training_completion_rules_training_batch_id_key` (`training_batch_id`),
  CONSTRAINT `training_completion_rules_training_batch_id_fkey`
    FOREIGN KEY (`training_batch_id`) REFERENCES `training_batches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
