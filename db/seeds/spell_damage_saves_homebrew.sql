-- SRD corrections for spells.base_damage_dice / opponent_save_roll.
-- Idempotent. Dice format: NdM or NdM+K (no spaces); flat bonuses need rollDice support (client/src/utils/math.js).
BEGIN;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS base_damage_dice TEXT;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS opponent_save_roll TEXT;
-- 1) SRD corrections (explicit overwrite of values seeded by spell_damage_saves.sql)
UPDATE spells SET base_damage_dice = '3d4+3' WHERE lower(name) = lower('Magic Missile');
UPDATE spells SET base_damage_dice = '10d6+40' WHERE lower(name) = lower('Disintegrate');
UPDATE spells SET base_damage_dice = '7d8+30' WHERE lower(name) = lower('Finger of Death');
UPDATE spells SET base_damage_dice = NULL WHERE lower(name) = lower('Sleep');
-- 2) SRD spells the API data missed (fill NULLs only)
UPDATE spells s SET base_damage_dice = COALESCE(s.base_damage_dice, v.dice), opponent_save_roll = COALESCE(s.opponent_save_roll, v.save)
FROM (VALUES
  ('Spirit Guardians', '3d8'::text, 'WIS'::text),
  ('Arcane Hand', '4d8'::text, NULL::text),
  ('Earthquake', '5d6'::text, 'DEX'::text),
  ('Geas', '5d10'::text, NULL::text),
  ('Glyph of Warding', '5d8'::text, 'DEX'::text),
  ('Prismatic Wall', '10d6'::text, 'DEX'::text),
  ('Spike Growth', '2d4'::text, NULL::text),
  ('Weird', '4d10'::text, NULL::text),
  ('Antipathy/Sympathy', NULL::text, 'WIS'::text),
  ('Call Lightning', NULL::text, 'DEX'::text),
  ('Detect Thoughts', NULL::text, 'WIS'::text),
  ('Flaming Sphere', NULL::text, 'DEX'::text),
  ('Forcecage', NULL::text, 'CHA'::text),
  ('Levitate', NULL::text, 'CON'::text),
  ('Power Word Stun', NULL::text, 'CON'::text),
  ('Sanctuary', NULL::text, 'WIS'::text),
  ('Seeming', NULL::text, 'CHA'::text),
  ('Sleet Storm', NULL::text, 'DEX'::text),
  ('True Polymorph', NULL::text, 'WIS'::text),
  ('Wall of Stone', NULL::text, 'DEX'::text),
  ('Web', NULL::text, 'DEX'::text),
  ('Zone of Truth', NULL::text, 'CHA'::text),
  ('Irresistible Dance', NULL::text, 'WIS'::text)
) AS v(name, dice, save) WHERE lower(s.name) = lower(v.name);
-- 3) Homebrew values were superseded by homebrew_rework.sql (2026-10-11) and removed from this file.
COMMIT;
