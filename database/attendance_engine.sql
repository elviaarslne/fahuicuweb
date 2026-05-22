USE fahuicu_system;

CREATE TABLE IF NOT EXISTS event_attendances (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  event_id VARCHAR(191) NOT NULL,
  status ENUM('REGISTERED', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'REGISTERED',
  source ENUM('QR', 'MANUAL') NOT NULL DEFAULT 'QR',
  checked_in_at DATETIME(3) NULL,
  checked_out_at DATETIME(3) NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY event_attendances_event_user_key (event_id, user_id),
  KEY event_attendances_user_id_idx (user_id),
  CONSTRAINT event_attendances_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_attendances_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT IGNORE INTO event_attendances (
  id,
  user_id,
  event_id,
  status,
  source,
  checked_in_at,
  created_at,
  updated_at
)
SELECT
  CONCAT('att_', LEFT(REPLACE(UUID(), '-', ''), 24)),
  ep.user_id,
  ep.event_id,
  CASE
    WHEN MAX(ep.attendance_status = 'PRESENT') = 1 THEN 'PRESENT'
    WHEN MAX(ep.attendance_status = 'LATE') = 1 THEN 'LATE'
    WHEN MAX(ep.attendance_status = 'EXCUSED') = 1 THEN 'EXCUSED'
    WHEN MAX(ep.attendance_status = 'ABSENT') = 1 THEN 'ABSENT'
    ELSE 'REGISTERED'
  END,
  'MANUAL',
  MIN(ep.checked_in_at),
  NOW(3),
  NOW(3)
FROM event_participants ep
GROUP BY ep.user_id, ep.event_id;
