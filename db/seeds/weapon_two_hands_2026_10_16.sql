-- Two hands toggle for versatile weapons (Actions tab)
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS two_handed BOOLEAN NOT NULL DEFAULT false;
-- fill any missing versatile die from the description, e.g. "versatile (1d10)"
UPDATE weapons SET versatile_dice = substring(description from 'versatile \((\d+d\d+)\)')
WHERE versatile_dice IS NULL AND description ~ 'versatile \(\d+d\d+\)';