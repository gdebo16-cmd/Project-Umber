-- 2026-10-22: allow current_hp above stored base max_hp (boosted effective max)
BEGIN;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_hp_range;
ALTER TABLE characters ADD CONSTRAINT characters_hp_range CHECK (max_hp > 0 AND current_hp >= 0);
COMMIT;
