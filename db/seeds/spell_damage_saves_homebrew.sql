-- SRD corrections for spells.base_damage_dice / opponent_save_roll.
-- Idempotent. Dice format: NdM or NdM+K (no spaces); flat bonuses need rollDice support (client/src/utils/math.js).
BEGIN;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS base_damage_dice TEXT;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS opponent_save_roll TEXT;
-- 1) SRD corrections (explicit overwrite of values seeded by spell_damage_saves.sql)
UPDATE spells SET base_damage_dice = '3d4+3' WHERE id = 305 /* Seeker Darts */;
UPDATE spells SET base_damage_dice = '10d6+40' WHERE id = 199 /* Unmaking Ray */;
UPDATE spells SET base_damage_dice = '7d8+30' WHERE id = 230 /* Deathpoint */;
UPDATE spells SET base_damage_dice = NULL WHERE id = 382 /* Slumber Mist */;
-- 2) SRD spells the API data missed (fill NULLs only)
UPDATE spells s SET base_damage_dice = COALESCE(s.base_damage_dice, v.dice), opponent_save_roll = COALESCE(s.opponent_save_roll, v.save)
FROM (VALUES
  (391 /* Spirit Ring */, '3d8'::text, 'WIS'::text),
  (131 /* Force Fist */, '4d8'::text, NULL::text),
  (210 /* Worldshake */, '5d6'::text, 'DEX'::text),
  (249 /* Binding Oath */, '5d10'::text, NULL::text),
  (254 /* Waiting Sigil */, '5d8'::text, 'DEX'::text),
  (343 /* Rainbow Barrier */, '10d6'::text, 'DEX'::text),
  (390 /* Rose Garden */, '2d4'::text, NULL::text),
  (427 /* Dreadweave */, '4d10'::text, NULL::text),
  (129 /* Lure and Repel */, NULL::text, 'WIS'::text),
  (152 /* Thunderhead */, NULL::text, 'DEX'::text),
  (196 /* Thoughtread */, NULL::text, 'WIS'::text),
  (237 /* Rolling Blaze */, NULL::text, 'DEX'::text),
  (243 /* Prism Cage */, NULL::text, 'CHA'::text),
  (294 /* Drift Rise */, NULL::text, 'CON'::text),
  (339 /* Stunning Utterance */, NULL::text, 'CON'::text),
  (365 /* Hallowed Refuge */, NULL::text, 'WIS'::text),
  (370 /* Glamour Masks */, NULL::text, 'CHA'::text),
  (383 /* Icestorm Squall */, NULL::text, 'DEX'::text),
  (411 /* Perfect Shift */, NULL::text, 'WIS'::text),
  (421 /* Stone Rampart */, NULL::text, 'DEX'::text),
  (426 /* Sticky Weave */, NULL::text, 'DEX'::text),
  (432 /* Banish Lies */, NULL::text, 'CHA'::text),
  (289 /* Compel Dance */, NULL::text, 'WIS'::text)
) AS v(id, dice, save) WHERE s.id = v.id;
-- 3) Homebrew values were superseded by homebrew_rework.sql (2026-10-11) and removed from this file.
COMMIT;
