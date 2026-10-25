-- Orc follow-ups (2026-10-25). Idempotent, single transaction. Safe to re-run.
BEGIN;

-- 1) Race signature spell state
ALTER TABLE races ADD COLUMN IF NOT EXISTS signature_state_id integer REFERENCES spell_state(id);
UPDATE races r SET signature_state_id = s.id
FROM (VALUES ('Uron','bless'),('Umber Elf','create'),('Ochre Elf','restore'),('Sable Elf','curse'),('Wyrmkin','evoke'),('Dwarf','create'),('Gnome','illusion'),('Hollowkin','seal'),('Rootborn','restore'),('Cindral','evoke'),('Vellari','illusion'),('Saltborn','manipulate'),('Wyrdling','illusion'),('Lumenwing','bless'),('Graniar','seal'),('Corvani','summon'),('Quillary','manipulate'),('Lupine','bless'),('Radiant','restore'),('Skyborn','summon'),('Gehennan','bind'),('Orc','break')) AS m(race, state)
JOIN spell_state s ON lower(s.name) = m.state
WHERE r.name = m.race AND r.signature_state_id IS DISTINCT FROM s.id;
-- Human picks its signature state, so it stays NULL.
UPDATE races SET signature_state_id = NULL WHERE name = 'Human' AND signature_state_id IS NOT NULL;

-- 2) Skill renames (handbook 01-core-mechanics, LOCKED). Whole words only; "Greater Arcana" and "Force of Nature" are left alone.
CREATE OR REPLACE FUNCTION pg_temp.skill_rename(t text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $f$
DECLARE m text[][] := ARRAY[['Athletics','Might'],['Acrobatics','Tumbling'],['Sleight of Hand','Quick Hands'],['Stealth','Shadowing'],['(?<!Greater )Arcana','Spellcraft'],['History','Lore of Ages'],['Investigation','Searching'],['(?<!Force of )Nature','Wildlore'],['Religion','Faiths'],['Animal Handling','Beastcraft'],['Insight','Reading People'],['Medicine','Mending'],['Perception','Watchfulness'],['Survival','Wayfinding'],['Deception','Guile'],['Intimidation','Menace'],['Performance','Showcraft'],['Persuasion','Parley']]; i int;
BEGIN IF t IS NULL THEN RETURN NULL; END IF; FOR i IN 1..array_length(m,1) LOOP t := regexp_replace(t, '\m' || m[i][1] || '\M', m[i][2], 'g'); END LOOP; RETURN t; END $f$;

DO $d$
DECLARE r record; n int;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('classes','skill_options','text[]'),('classes','skill_fixed','text[]'),
    ('characters','skill_proficiencies','text[]'),('characters','feature_choices','jsonb'),
    ('race_lineage_bonuses','skill','text'),('race_lineage_bonuses','description','text'),
    ('class_levels','description','text'),('class_features','description','text'),('class_features','options','text[]'),
    ('class_feature_options','description','text'),('subclass_features','description','text'),('subraces','description','text'),
    ('primordial_blessings','description','text'),('personality_options','perk','text'),
    ('armor','description','text'),('armor','properties','jsonb'),('armor','effects','jsonb'),
    ('runes','effect','text'),('items','description','text'),('items','effects','jsonb')) AS v(tbl,col,typ)
  LOOP
    EXECUTE format('UPDATE %I SET %I = (pg_temp.skill_rename(%I::text))::%s WHERE %I::text IS DISTINCT FROM pg_temp.skill_rename(%I::text)', r.tbl, r.col, r.col, r.typ, r.col, r.col);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'skill rename %.%: % rows', r.tbl, r.col, n;
  END LOOP;
END $d$;

-- Orc Thick-Boned grants Might
UPDATE race_lineage_bonuses SET skill = 'Might'
WHERE race_id = (SELECT id FROM races WHERE name = 'Orc') AND name = 'Thick-Boned' AND skill IS DISTINCT FROM 'Might';

-- 3) Knuckle Crack (Orc starter cantrip). Stored like Spark Grip. No race-spell link table exists, so it is not linked to Orc.
INSERT INTO spells (name, casting_time, range, duration, base_level, base_description, state_id, element_id, alignment_id, base_damage_dice, attack_type, base_to_hit_modifier, action_type, heal_add_mod, color)
SELECT 'Knuckle Crack', 1, 5, 0, 0,
  'Melee spell attack: 1d10 bludgeoning, and an object or barrier you hit takes double. 2d10 at 5, 3d10 at 11, 4d10 at 17.',
  (SELECT id FROM spell_state WHERE name = 'break'), 16, (SELECT id FROM spell_alignment WHERE "Name" = 'Red Magic'),
  '1d10', 'melee', 1, 'action', false, 'Red'
WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Knuckle Crack');

COMMIT;