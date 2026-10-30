-- 10: move live feature/spell/item mechanics onto roles/callings/species (restructure)
-- Rerunnable. Keeps legacy tables. Extends level check to 30. Adds link_id for feature_choices.

BEGIN;

-- allow features through level 30 (sheet max)
ALTER TABLE role_features DROP CONSTRAINT IF EXISTS role_features_level_check;
ALTER TABLE role_features ADD CONSTRAINT role_features_level_check CHECK (level >= 1 AND level <= 30);
ALTER TABLE calling_features DROP CONSTRAINT IF EXISTS calling_features_level_check;
ALTER TABLE calling_features ADD CONSTRAINT calling_features_level_check CHECK (level >= 1 AND level <= 30);

ALTER TABLE role_features
  ADD COLUMN IF NOT EXISTS link_id integer,
  ADD COLUMN IF NOT EXISTS legacy_feature_id integer,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS uses text,
  ADD COLUMN IF NOT EXISTS dice text,
  ADD COLUMN IF NOT EXISTS options text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS choice_count integer,
  ADD COLUMN IF NOT EXISTS ember_cost integer,
  ADD COLUMN IF NOT EXISTS embers_per_die boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_scaling jsonb,
  ADD COLUMN IF NOT EXISTS dice_scaling jsonb,
  ADD COLUMN IF NOT EXISTS rest_lock text,
  ADD COLUMN IF NOT EXISTS kindles_slot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cracks_gained integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cracks_removed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rest_uses integer,
  ADD COLUMN IF NOT EXISTS uses_scaling jsonb,
  ADD COLUMN IF NOT EXISTS on_weapon_hit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE calling_features
  ADD COLUMN IF NOT EXISTS link_id integer,
  ADD COLUMN IF NOT EXISTS legacy_feature_id integer,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS uses text,
  ADD COLUMN IF NOT EXISTS dice text,
  ADD COLUMN IF NOT EXISTS options text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS choice_count integer,
  ADD COLUMN IF NOT EXISTS ember_cost integer,
  ADD COLUMN IF NOT EXISTS embers_per_die boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_scaling jsonb,
  ADD COLUMN IF NOT EXISTS dice_scaling jsonb,
  ADD COLUMN IF NOT EXISTS rest_lock text,
  ADD COLUMN IF NOT EXISTS kindles_slot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cracks_gained integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cracks_removed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rest_uses integer,
  ADD COLUMN IF NOT EXISTS uses_scaling jsonb,
  ADD COLUMN IF NOT EXISTS on_weapon_hit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hp_per_level integer,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE species_features
  ADD COLUMN IF NOT EXISTS link_id integer,
  ADD COLUMN IF NOT EXISTS legacy_feature_id integer,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS uses text,
  ADD COLUMN IF NOT EXISTS dice text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;
-- level column already exists on species_features

-- sequences for link_id
CREATE SEQUENCE IF NOT EXISTS role_features_link_id_seq;
CREATE SEQUENCE IF NOT EXISTS calling_features_link_id_seq;
CREATE SEQUENCE IF NOT EXISTS species_features_link_id_seq;

-- ensure every distinct class/subclass/race feature name exists in features
INSERT INTO features (key, name, type, description, data)
SELECT
  lower(regexp_replace(regexp_replace(n, '[^a-zA-Z0-9]+', '_', 'g'), '^_|_$', '', 'g')),
  n,
  'passive',
  NULL,
  '{}'::jsonb
FROM (
  SELECT DISTINCT name AS n FROM class_features
  UNION
  SELECT DISTINCT name FROM subclass_features
  UNION
  SELECT DISTINCT name FROM race_lineage_bonuses
) x
WHERE NOT EXISTS (
  SELECT 1 FROM features f WHERE lower(f.name) = lower(x.n)
)
ON CONFLICT (key) DO NOTHING;

-- fix key collisions by appending a suffix when insert skipped due to key clash with different name
INSERT INTO features (key, name, type, description, data)
SELECT
  lower(regexp_replace(regexp_replace(n, '[^a-zA-Z0-9]+', '_', 'g'), '^_|_$', '', 'g')) || '_legacy',
  n,
  'passive',
  NULL,
  '{}'::jsonb
FROM (
  SELECT DISTINCT name AS n FROM class_features
  UNION
  SELECT DISTINCT name FROM subclass_features
  UNION
  SELECT DISTINCT name FROM race_lineage_bonuses
) x
WHERE NOT EXISTS (SELECT 1 FROM features f WHERE lower(f.name) = lower(x.n))
ON CONFLICT (key) DO NOTHING;

-- role map helper via CTE in upserts
-- Upsert role_features from class_features (match role by name map; feature by name)
INSERT INTO role_features (
  role_id, feature_id, level, rank, data, legacy_feature_id,
  action_type, uses, dice, options, choice_count,
  ember_cost, embers_per_die, cost_scaling, dice_scaling, rest_lock,
  kindles_slot, cracks_gained, cracks_removed, rest_uses, uses_scaling, on_weapon_hit, description
)
SELECT
  ro.id,
  f.id,
  cf.level,
  1,
  COALESCE(rf_existing.data, '{}'::jsonb) || jsonb_build_object('legacy_class_feature_id', cf.id),
  cf.id,
  cf.action_type, cf.uses, cf.dice, COALESCE(cf.options, '{}'), cf.choice_count,
  cf.ember_cost, COALESCE(cf.embers_per_die, false), cf.cost_scaling, cf.dice_scaling, cf.rest_lock,
  COALESCE(cf.kindles_slot, false), COALESCE(cf.cracks_gained, 0), COALESCE(cf.cracks_removed, 0),
  cf.rest_uses, cf.uses_scaling, COALESCE(cf.on_weapon_hit, false), cf.description
FROM class_features cf
JOIN classes cl ON cl.id = cf.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
JOIN features f ON lower(f.name) = lower(cf.name)
LEFT JOIN role_features rf_existing
  ON rf_existing.role_id = ro.id AND rf_existing.feature_id = f.id AND rf_existing.level = cf.level
ON CONFLICT (role_id, feature_id, level) DO UPDATE SET
  legacy_feature_id = EXCLUDED.legacy_feature_id,
  action_type = EXCLUDED.action_type,
  uses = EXCLUDED.uses,
  dice = EXCLUDED.dice,
  options = EXCLUDED.options,
  choice_count = EXCLUDED.choice_count,
  ember_cost = EXCLUDED.ember_cost,
  embers_per_die = EXCLUDED.embers_per_die,
  cost_scaling = EXCLUDED.cost_scaling,
  dice_scaling = EXCLUDED.dice_scaling,
  rest_lock = EXCLUDED.rest_lock,
  kindles_slot = EXCLUDED.kindles_slot,
  cracks_gained = EXCLUDED.cracks_gained,
  cracks_removed = EXCLUDED.cracks_removed,
  rest_uses = EXCLUDED.rest_uses,
  uses_scaling = EXCLUDED.uses_scaling,
  on_weapon_hit = EXCLUDED.on_weapon_hit,
  description = COALESCE(EXCLUDED.description, role_features.description),
  data = role_features.data || jsonb_build_object('legacy_class_feature_id', EXCLUDED.legacy_feature_id);

-- calling_features from subclass_features
INSERT INTO calling_features (
  calling_id, feature_id, level, rank, data, legacy_feature_id,
  action_type, uses, dice, options, choice_count,
  ember_cost, embers_per_die, cost_scaling, dice_scaling, rest_lock,
  kindles_slot, cracks_gained, cracks_removed, rest_uses, uses_scaling, on_weapon_hit,
  hp_per_level, description
)
SELECT
  ca.id,
  f.id,
  sf.level,
  1,
  COALESCE(cf_existing.data, '{}'::jsonb) || jsonb_build_object('legacy_subclass_feature_id', sf.id),
  sf.id,
  sf.action_type, sf.uses, sf.dice, COALESCE(sf.options, '{}'), sf.choice_count,
  sf.ember_cost, COALESCE(sf.embers_per_die, false), sf.cost_scaling, sf.dice_scaling, sf.rest_lock,
  COALESCE(sf.kindles_slot, false), COALESCE(sf.cracks_gained, 0), COALESCE(sf.cracks_removed, 0),
  sf.rest_uses, sf.uses_scaling, COALESCE(sf.on_weapon_hit, false),
  sf.hp_per_level, sf.description
FROM subclass_features sf
JOIN sub_classes sc ON sc.id = sf.subclass_id
JOIN callings ca ON ca.legacy_subclass_id = sc.id
JOIN features f ON lower(f.name) = lower(sf.name)
LEFT JOIN calling_features cf_existing
  ON cf_existing.calling_id = ca.id AND cf_existing.feature_id = f.id AND cf_existing.level = sf.level
ON CONFLICT (calling_id, feature_id, level) DO UPDATE SET
  legacy_feature_id = EXCLUDED.legacy_feature_id,
  action_type = EXCLUDED.action_type,
  uses = EXCLUDED.uses,
  dice = EXCLUDED.dice,
  options = EXCLUDED.options,
  choice_count = EXCLUDED.choice_count,
  ember_cost = EXCLUDED.ember_cost,
  embers_per_die = EXCLUDED.embers_per_die,
  cost_scaling = EXCLUDED.cost_scaling,
  dice_scaling = EXCLUDED.dice_scaling,
  rest_lock = EXCLUDED.rest_lock,
  kindles_slot = EXCLUDED.kindles_slot,
  cracks_gained = EXCLUDED.cracks_gained,
  cracks_removed = EXCLUDED.cracks_removed,
  rest_uses = EXCLUDED.rest_uses,
  uses_scaling = EXCLUDED.uses_scaling,
  on_weapon_hit = EXCLUDED.on_weapon_hit,
  hp_per_level = EXCLUDED.hp_per_level,
  description = COALESCE(EXCLUDED.description, calling_features.description),
  data = calling_features.data || jsonb_build_object('legacy_subclass_feature_id', EXCLUDED.legacy_feature_id);

-- species_features from race_lineage_bonuses (parent species = race)
INSERT INTO species_features (species_id, feature_id, data, legacy_feature_id, action_type, uses, dice, description, level)
SELECT
  s.id, f.id,
  jsonb_build_object('legacy_race_lineage_id', rlb.id),
  rlb.id, rlb.action_type, rlb.uses, rlb.dice, rlb.description, COALESCE(rlb.level, 1)
FROM race_lineage_bonuses rlb
JOIN species s ON s.parent_id IS NULL AND s.sort_order = rlb.race_id
JOIN features f ON lower(f.name) = lower(rlb.name)
ON CONFLICT (species_id, feature_id) DO UPDATE SET
  legacy_feature_id = EXCLUDED.legacy_feature_id,
  action_type = EXCLUDED.action_type,
  uses = EXCLUDED.uses,
  dice = EXCLUDED.dice,
  description = COALESCE(EXCLUDED.description, species_features.description),
  level = EXCLUDED.level,
  data = species_features.data || jsonb_build_object('legacy_race_lineage_id', EXCLUDED.legacy_feature_id);

-- assign link_id where missing
UPDATE role_features SET link_id = nextval('role_features_link_id_seq') WHERE link_id IS NULL;
UPDATE calling_features SET link_id = nextval('calling_features_link_id_seq') WHERE link_id IS NULL;
UPDATE species_features SET link_id = nextval('species_features_link_id_seq') WHERE link_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS role_features_link_id_uidx ON role_features (link_id);
CREATE UNIQUE INDEX IF NOT EXISTS calling_features_link_id_uidx ON calling_features (link_id);
CREATE UNIQUE INDEX IF NOT EXISTS species_features_link_id_uidx ON species_features (link_id);
CREATE INDEX IF NOT EXISTS role_features_legacy_idx ON role_features (legacy_feature_id);
CREATE INDEX IF NOT EXISTS calling_features_legacy_idx ON calling_features (legacy_feature_id);

-- role_spell_slots
DROP TABLE IF EXISTS role_spell_slots CASCADE;
CREATE TABLE IF NOT EXISTS role_spell_slots (
  id serial PRIMARY KEY,
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  calling_id integer REFERENCES callings(id) ON DELETE CASCADE,
  level integer NOT NULL,
  slot_level integer NOT NULL,
  slots integer NOT NULL
);
CREATE UNIQUE INDEX role_spell_slots_uidx ON role_spell_slots (role_id, COALESCE(calling_id, 0), level, slot_level);

INSERT INTO role_spell_slots (role_id, calling_id, level, slot_level, slots)
SELECT ro.id,
  CASE WHEN css.subclass_id IS NULL THEN NULL ELSE ca.id END,
  css.level, css.slot_level, css.slots
FROM class_spell_slots css
JOIN classes cl ON cl.id = css.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
LEFT JOIN sub_classes sc ON sc.id = css.subclass_id
LEFT JOIN callings ca ON ca.legacy_subclass_id = sc.id
ON CONFLICT DO NOTHING;

-- Manual upsert via NOT EXISTS because ON CONFLICT needs constraint name for expression index
-- Clear and refill for rerunnability
TRUNCATE role_spell_slots RESTART IDENTITY;
INSERT INTO role_spell_slots (role_id, calling_id, level, slot_level, slots)
SELECT ro.id,
  CASE WHEN css.subclass_id IS NULL THEN NULL ELSE ca.id END,
  css.level, css.slot_level, css.slots
FROM class_spell_slots css
JOIN classes cl ON cl.id = css.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
LEFT JOIN sub_classes sc ON sc.id = css.subclass_id
LEFT JOIN callings ca ON ca.legacy_subclass_id = sc.id;

-- role_spells
DROP TABLE IF EXISTS role_spells CASCADE;
CREATE TABLE IF NOT EXISTS role_spells (
  id serial PRIMARY KEY,
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  calling_id integer REFERENCES callings(id) ON DELETE CASCADE,
  spell_id integer NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  min_level integer NOT NULL DEFAULT 1,
  is_bonus boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX role_spells_uidx ON role_spells (role_id, COALESCE(calling_id, 0), spell_id, is_bonus);

TRUNCATE role_spells RESTART IDENTITY;
INSERT INTO role_spells (role_id, calling_id, spell_id, min_level, is_bonus)
SELECT ro.id,
  CASE WHEN cs.subclass_id IS NULL THEN NULL ELSE ca.id END,
  cs.spell_id, cs.min_level, COALESCE(cs.is_bonus, false)
FROM class_spells cs
JOIN classes cl ON cl.id = cs.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
LEFT JOIN sub_classes sc ON sc.id = cs.subclass_id
LEFT JOIN callings ca ON ca.legacy_subclass_id = sc.id;

-- role_item_proficiencies
DROP TABLE IF EXISTS role_item_proficiencies CASCADE;
CREATE TABLE IF NOT EXISTS role_item_proficiencies (
  id serial PRIMARY KEY,
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  calling_id integer REFERENCES callings(id) ON DELETE CASCADE,
  item_kind text NOT NULL CHECK (item_kind IN ('armor','weapon')),
  match_field text NOT NULL CHECK (match_field IN ('armor_type','weapon_category')),
  match_value text NOT NULL,
  min_level integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX role_item_prof_uidx ON role_item_proficiencies
  (role_id, COALESCE(calling_id, 0), item_kind, match_field, match_value);

TRUNCATE role_item_proficiencies RESTART IDENTITY;
INSERT INTO role_item_proficiencies (role_id, calling_id, item_kind, match_field, match_value, min_level)
SELECT ro.id,
  CASE WHEN cip.subclass_id IS NULL THEN NULL ELSE ca.id END,
  cip.item_kind, cip.match_field, cip.match_value, cip.min_level
FROM class_item_proficiencies cip
JOIN classes cl ON cl.id = cip.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
LEFT JOIN sub_classes sc ON sc.id = cip.subclass_id
LEFT JOIN callings ca ON ca.legacy_subclass_id = sc.id;

COMMIT;
