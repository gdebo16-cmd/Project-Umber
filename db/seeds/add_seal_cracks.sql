-- Seal Cracks, weapon-hit features, uses-per-rest counts (Gabriel 2026-10-16). Idempotent.
-- Rules: rules/15-gracewraith.md (Seal Cracks, Breach, Reseal, Radiance cost table).
BEGIN;

-- Per-character state
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS cracks    integer NOT NULL DEFAULT 0,             -- Seal Cracks, 0..classes.crack_max
  ADD COLUMN IF NOT EXISTS rest_uses jsonb   NOT NULL DEFAULT '{}'::jsonb;   -- { "class-1047": 1 } uses spent since the feature's recovery rest
-- carry over the old once-per-rest locks (rest_locks is no longer read)
UPDATE characters SET rest_uses = (SELECT COALESCE(jsonb_object_agg(key, 1), '{}'::jsonb) FROM jsonb_each(rest_locks) WHERE value = 'true'::jsonb)
WHERE rest_uses = '{}'::jsonb AND rest_locks <> '{}'::jsonb;

-- Class-level Crack rules
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS crack_max         integer,   -- NULL = class has no Crack track
  ADD COLUMN IF NOT EXISTS breach_dc         integer,   -- CON save when you would pass crack_max
  ADD COLUMN IF NOT EXISTS breach_dc_scaling jsonb;     -- [{ level, dc }]
UPDATE classes SET crack_max = 5, breach_dc = 15, breach_dc_scaling = '[{"level":13,"dc":12}]' WHERE id = 15;

-- Subclass Breach effects (on a failed Breach save)
ALTER TABLE sub_classes
  ADD COLUMN IF NOT EXISTS breach_effect          text,
  ADD COLUMN IF NOT EXISTS breach_drains_radiance boolean NOT NULL DEFAULT false;
UPDATE sub_classes SET breach_effect = 'One creature of the GM''s choice within 30 ft (ally or enemy) is restrained until the end of its next turn (save ends, class DC).' WHERE class_id = 15 AND name = 'Archonbound';
UPDATE sub_classes SET breach_effect = '10-ft burst centered on you: 3d8 radiant to every creature but you (DEX save, class DC, half).' WHERE class_id = 15 AND name = 'Seraphbound';
UPDATE sub_classes SET breach_effect = 'You lose all remaining Radiance.', breach_drains_radiance = true WHERE class_id = 15 AND name = 'Virtuebound';

-- Weapons that take Crack damage and Sigil Strike
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS sigil_weapon boolean NOT NULL DEFAULT false;
UPDATE weapons SET sigil_weapon = (name ~ '^(Sigil Blade|Spiked Chain|Chain Whip|Flail)( \+[0-9])?$');

-- Feature data on both feature tables
ALTER TABLE class_features
  ADD COLUMN IF NOT EXISTS cracks_gained  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cracks_removed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rest_uses      integer,                          -- uses per recovery (rest_lock = 'short' or 'long')
  ADD COLUMN IF NOT EXISTS uses_scaling   jsonb,                            -- [{ level, uses }]
  ADD COLUMN IF NOT EXISTS on_weapon_hit  boolean NOT NULL DEFAULT false;   -- offered on sigil-weapon damage rolls
ALTER TABLE subclass_features
  ADD COLUMN IF NOT EXISTS cracks_gained  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cracks_removed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rest_uses      integer,
  ADD COLUMN IF NOT EXISTS uses_scaling   jsonb,
  ADD COLUMN IF NOT EXISTS on_weapon_hit  boolean NOT NULL DEFAULT false;

-- Class features (Gracewraith)
UPDATE class_features SET on_weapon_hit = true, dice_scaling = '[{"level":1,"dice":"1d8"},{"level":11,"dice":"2d8"},{"level":23,"dice":"3d8"}]' WHERE class_id = 15 AND name = 'Sigil Strike';
UPDATE class_features SET rest_uses = 2, uses_scaling = '[{"level":13,"uses":3}]', rest_lock = 'short', cracks_removed = 1,
  dice_scaling = '[{"level":2,"dice":"1d6"},{"level":11,"dice":"2d6"},{"level":23,"dice":"3d6"}]' WHERE class_id = 15 AND name = 'Reseal';
UPDATE class_features SET rest_uses = 1, rest_lock = 'long' WHERE class_id = 15 AND name IN ('Kindled Slot', 'Bind the Surge', 'Divine Chains Capstone');
UPDATE class_features SET cracks_gained = 1 WHERE class_id = 15 AND name IN ('Wrested Wings', 'Radiant Lash');
UPDATE class_features SET dice_scaling = '[{"level":15,"dice":"6d8"},{"level":25,"dice":"8d8"}]' WHERE class_id = 15 AND name = 'Radiant Lash';

-- Subclass features (Gracewraith)
UPDATE subclass_features sf SET cracks_gained = 1 FROM sub_classes sc
WHERE sc.id = sf.subclass_id AND sc.class_id = 15 AND sf.name IN ('Borrowed Miracle', 'Iron Edict', 'Burning Choir', 'Sanctum of Theft');
UPDATE subclass_features sf SET rest_uses = 1, rest_lock = 'long', cracks_gained = 2 FROM sub_classes sc
WHERE sc.id = sf.subclass_id AND sc.class_id = 15 AND sf.name = 'Stolen Resurrection';
UPDATE subclass_features sf SET rest_uses = 1, rest_lock = 'long' FROM sub_classes sc
WHERE sc.id = sf.subclass_id AND sc.class_id = 15 AND sf.name = 'Sentence Passed';

COMMIT;
