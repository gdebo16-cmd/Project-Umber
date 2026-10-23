-- Optional premade portrait picked in the Character Editor. NULL = /default-character.png
ALTER TABLE characters ADD COLUMN IF NOT EXISTS portrait_url TEXT;
