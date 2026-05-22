ALTER TABLE users
  ADD COLUMN language_preference ENUM('id','zh_TW') NOT NULL DEFAULT 'id' AFTER member_status,
  ADD COLUMN journal_visibility ENUM('PRIVATE_ONLY') NOT NULL DEFAULT 'PRIVATE_ONLY' AFTER language_preference,
  ADD COLUMN selected_workspace ENUM('MEMBER','SPEAKER','TRAINER','ADMIN') NOT NULL DEFAULT 'MEMBER' AFTER journal_visibility;
