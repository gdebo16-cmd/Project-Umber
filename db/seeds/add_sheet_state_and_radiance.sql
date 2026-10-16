-- Saved per-character sheet state + data-driven Radiance features (Gabriel 2026-10-16). Idempotent.
BEGIN;

-- Per-rest state that used to live only in the browser
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS used_slots     jsonb   NOT NULL DEFAULT '{}'::jsonb,  -- { "1": 2, "2": 1 } slots used per slot level
  ADD COLUMN IF NOT EXISTS radiance_spent integer NOT NULL DEFAULT 0,            -- Radiance below the pool max
  ADD COLUMN IF NOT EXISTS rest_locks     jsonb   NOT NULL DEFAULT '{}'::jsonb,  -- { "class-1234": true } once-per-rest features used
  ADD COLUMN IF NOT EXISTS conditions     jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS exhaustion     integer NOT NULL DEFAULT 0;

-- Which classes have a Radiance pool
ALTER TABLE classes ADD COLUMN IF NOT EXISTS has_radiance boolean NOT NULL DEFAULT false;
UPDATE classes SET has_radiance = (id = 15);

-- Feature costs as data, on both feature tables
ALTER TABLE class_features
  ADD COLUMN IF NOT EXISTS radiance_cost    integer,                         -- Radiance per use (or per die)
  ADD COLUMN IF NOT EXISTS radiance_per_die boolean NOT NULL DEFAULT false,  -- cost is per die, up to proficiency bonus dice
  ADD COLUMN IF NOT EXISTS cost_scaling     jsonb,                           -- [{ level, cost }] cheaper at higher levels
  ADD COLUMN IF NOT EXISTS dice_scaling     jsonb,                           -- [{ level, dice }] bigger dice at higher levels
  ADD COLUMN IF NOT EXISTS rest_lock        text CHECK (rest_lock IN ('short', 'long')),  -- once per short/long rest
  ADD COLUMN IF NOT EXISTS kindles_slot     boolean NOT NULL DEFAULT false;  -- spend a spell slot, regain Radiance = slot level
ALTER TABLE subclass_features
  ADD COLUMN IF NOT EXISTS radiance_cost    integer,
  ADD COLUMN IF NOT EXISTS radiance_per_die boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_scaling     jsonb,
  ADD COLUMN IF NOT EXISTS dice_scaling     jsonb,
  ADD COLUMN IF NOT EXISTS rest_lock        text CHECK (rest_lock IN ('short', 'long')),
  ADD COLUMN IF NOT EXISTS kindles_slot     boolean NOT NULL DEFAULT false;

-- Gracewraith class features
UPDATE class_features SET radiance_cost = 1, dice_scaling = '[{"level":11,"dice":"2d8"},{"level":23,"dice":"3d8"}]' WHERE class_id = 15 AND name = 'Sigil Strike';
UPDATE class_features SET radiance_cost = 1 WHERE class_id = 15 AND name = 'Chain Reach';
UPDATE class_features SET radiance_cost = 2, cost_scaling = '[{"level":27,"cost":1}]' WHERE class_id = 15 AND name = 'Shackle';
UPDATE class_features SET radiance_cost = 4, dice_scaling = '[{"level":25,"dice":"8d8"}]' WHERE class_id = 15 AND name = 'Radiant Lash';
UPDATE class_features SET kindles_slot = true, rest_lock = 'long' WHERE class_id = 15 AND name = 'Kindled Slot';

-- Gracewraith subclass features
UPDATE subclass_features sf SET radiance_cost = 1, radiance_per_die = true
FROM sub_classes sc WHERE sc.id = sf.subclass_id AND sc.class_id = 15 AND sf.name = 'Bound Virtue';
UPDATE subclass_features sf SET radiance_cost = 2
FROM sub_classes sc WHERE sc.id = sf.subclass_id AND sc.class_id = 15
  AND sf.name IN ('Borrowed Miracle', 'Iron Edict', 'Burning Choir', 'Sanctum of Theft');

COMMIT;
