ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATETIME NULL AFTER qiu_dao_card_url;
ALTER TABLE events ADD COLUMN IF NOT EXISTS minimum_age INT NULL AFTER minimum_participants;
ALTER TABLE events ADD COLUMN IF NOT EXISTS maximum_age INT NULL AFTER minimum_age;
