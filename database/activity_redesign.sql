-- Activity module redesign: profile username, carousel media, likes, comments, and moderation.
-- Safe for existing V1 data: keeps legacy activity_posts.image_url and is_active columns.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS bio TEXT NULL,
  ADD COLUMN IF NOT EXISTS activity_profile_updated_at DATETIME(3) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);

ALTER TABLE activity_posts
  MODIFY COLUMN caption TEXT NULL,
  MODIFY COLUMN type ENUM('EVENT_PHOTO','LEARNING_PROGRESS','SERVICE','GRATITUDE','DOCUMENTATION','OTHER') NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS visibility ENUM('INTERNAL') NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN IF NOT EXISTS is_hidden_by_admin TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME(3) NULL;

CREATE INDEX IF NOT EXISTS activity_posts_visibility_hidden_deleted_idx
  ON activity_posts(visibility, is_hidden_by_admin, deleted_at);

CREATE TABLE IF NOT EXISTS activity_media (
  id VARCHAR(191) NOT NULL,
  post_id VARCHAR(191) NOT NULL,
  media_url TEXT NOT NULL,
  media_type ENUM('IMAGE','VIDEO') NOT NULL,
  order_number INT NOT NULL DEFAULT 0,
  alt_text VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX activity_media_post_id_idx (post_id),
  CONSTRAINT activity_media_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES activity_posts(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_likes (
  id VARCHAR(191) NOT NULL,
  post_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY activity_likes_post_id_user_id_key (post_id, user_id),
  INDEX activity_likes_user_id_idx (user_id),
  CONSTRAINT activity_likes_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES activity_posts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT activity_likes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_comments (
  id VARCHAR(191) NOT NULL,
  post_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  content TEXT NOT NULL,
  is_hidden_by_admin TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX activity_comments_post_id_idx (post_id),
  INDEX activity_comments_user_id_idx (user_id),
  INDEX activity_comments_hidden_deleted_idx (is_hidden_by_admin, deleted_at),
  CONSTRAINT activity_comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES activity_posts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT activity_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
