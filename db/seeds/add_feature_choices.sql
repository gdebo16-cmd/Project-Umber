-- Feature choices: which class/subclass features need a permanent pick, and the character's picks.
-- Idempotent: safe to run more than once. Matches features by owner name + feature name + level
-- (not id) so it works on any copy of the database.

ALTER TABLE class_features    ADD COLUMN IF NOT EXISTS options TEXT[];
ALTER TABLE class_features    ADD COLUMN IF NOT EXISTS choice_count INTEGER;
ALTER TABLE subclass_features ADD COLUMN IF NOT EXISTS options TEXT[];
ALTER TABLE subclass_features ADD COLUMN IF NOT EXISTS choice_count INTEGER;
ALTER TABLE characters        ADD COLUMN IF NOT EXISTS feature_choices JSONB NOT NULL DEFAULT '{}';

-- class features
UPDATE class_features f SET options = v.opts, choice_count = 1
FROM (VALUES
    ('Assassin', 1,  'Expertise',                 ARRAY['Thieves'' Tools','Acrobatics','Investigation']),
    ('Assassin', 3,  'Tool Training',             ARRAY['Poisoner''s Kit','Disguise Kit']),
    ('Assassin', 15, 'Slippery Mind',             ARRAY['WIS Save Proficiency','Advantage vs Charmed and Frightened']),
    ('Knight',   1,  'Knightly Bearing',          ARRAY['Athletics Expertise','Intimidation Proficiency']),
    ('Knight',   1,  'Fighting Style',            ARRAY['Defense','Dueling','Protection','Great Weapon']),
    ('Lancer',   1,  'Fighting Style',            ARRAY['Defense','Dueling (spear + shield)','Great Weapon','Interception','Two-Weapon (dual spears)']),
    ('Paladin',  2,  'Fighting Style',            ARRAY['Defense','Dueling','Great Weapon','Protection']),
    ('Ranger',   1,  'Favored Terrain and Tracker', ARRAY['Forest','Mountain','Swamp','Tundra/Galleries','Jungle/Caldera','Plains','Urban']),
    ('Ranger',   2,  'Fighting Style',            ARRAY['Archery','Two-Weapon','Defense','Blind Fighting']),
    ('Ranger',   13, 'Second Favored Terrain',    ARRAY['Forest','Mountain','Swamp','Tundra/Galleries','Jungle/Caldera','Plains','Urban']),
    ('Warrior',  1,  'Fighting Style',            ARRAY['Defense','Dueling','Great Weapon','Protection','Two-Weapon','Archery']),
    ('Warrior',  25, 'Extra Attack (5) or War Absolute', ARRAY['Extra Attack (5)','War Absolute']),
    ('Witch',    20, 'Crone / Warlock',           ARRAY['Crone','Warlock'])
) AS v(owner, lvl, fname, opts), classes c
WHERE c.id = f.class_id AND c.name = v.owner AND f.level = v.lvl AND f.name = v.fname;

-- subclass features
UPDATE subclass_features f SET options = v.opts, choice_count = 1
FROM (VALUES
    ('Archer',  3,  'Point-Blank or Longshot', ARRAY['Point-Blank','Longshot']),
    ('Evoker',  10, 'Elemental Affinity',      ARRAY['Acid','Cold','Fire','Lightning','Thunder']),
    ('Tamer',   3,  'Companion',               ARRAY['Land','Air','Water']),
    ('Tamer',   24, 'Mythic Alpha',            ARRAY['Second Companion','Large Companion'])
) AS v(owner, lvl, fname, opts), sub_classes s
WHERE s.id = f.subclass_id AND s.name = v.owner AND f.level = v.lvl AND f.name = v.fname;