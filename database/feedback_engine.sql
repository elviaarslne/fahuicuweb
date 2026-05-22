USE fahuicu_system;

ALTER TABLE feedbacks
  ADD COLUMN IF NOT EXISTS material_purpose_rating INT NULL,
  ADD COLUMN IF NOT EXISTS delivery_clarity_rating INT NULL,
  ADD COLUMN IF NOT EXISTS time_effectiveness_rating INT NULL,
  ADD COLUMN IF NOT EXISTS flow_clarity_rating INT NULL,
  ADD COLUMN IF NOT EXISTS perspective_change_rating INT NULL,
  ADD COLUMN IF NOT EXISTS join_again_rating INT NULL,
  ADD COLUMN IF NOT EXISTS understanding_rating INT NULL,
  ADD COLUMN IF NOT EXISTS registration_ease_rating INT NULL,
  ADD COLUMN IF NOT EXISTS coordination_clarity_rating INT NULL,
  ADD COLUMN IF NOT EXISTS location_comfort_rating INT NULL,
  ADD COLUMN IF NOT EXISTS insight_text TEXT NULL;
