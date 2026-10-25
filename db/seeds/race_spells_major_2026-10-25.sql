-- Race spells for Major (2026-10-25). Idempotent, single transaction. Source: handbook rules/race-spells-for-major.md.
BEGIN;

-- the creation pick for races that choose their starter (Human, Wyrmkin); NULL = use races.race_spell_id
ALTER TABLE characters ADD COLUMN IF NOT EXISTS race_spell_id integer REFERENCES spells(id) ON DELETE SET NULL;

-- the level-0 "Blood Tether" is now Vein Snare (the level-3 Blood Tether keeps its name)
UPDATE spells SET name = 'Vein Snare' WHERE name = 'Blood Tether' AND base_level = 0
  AND NOT EXISTS (SELECT 1 FROM spells x WHERE x.name = 'Vein Snare' AND x.base_level = 0);

-- New level-0 spells. Duration is in rounds; out-of-combat time and scaling live in the description.
INSERT INTO spells (name, casting_time, range, duration, base_level, base_description, state_id, element_id, alignment_id, base_damage_dice, opponent_save_roll, attack_type, action_type, heal_add_mod, color)
SELECT v.name, v.ct, v.rng, v.dur, 0, v.descr,
       (SELECT id FROM spell_state WHERE lower(name) = v.st),
       (SELECT id FROM spell_element WHERE name = v.el),
       (SELECT id FROM spell_alignment WHERE "Name" = v.col || ' Magic'),
       v.dice, v.save, v.atk, v.act, false, v.col
FROM (VALUES
  ('Ember Spark', 1, 60, 0::numeric, 'Make a ranged spell attack against one creature or object. On a hit it takes 1d10 fire damage. A flammable object that isn''t worn or carried catches fire. 2d10 at 5, 3d10 at 11, 4d10 at 17.', 'evoke', 'Flame', 'Red', '1d10', NULL, 'ranged', 'action'),
  ('Bend Water', 1, 30, 10, 'Choose water you can see in an area up to a 5-ft cube (10 rounds / 1 hour). Move it up to 5 ft or change its flow; shape it into simple forms that hold; make it clear or cloudy; or freeze or thaw it if no bigger than a 1-ft cube. Up to two effects at once. Area: 10-ft cube at 5, 15-ft at 11, 20-ft at 17.', 'manipulate', 'Flood', 'Grey', NULL, NULL, NULL, 'action'),
  ('Breath Iron', 1, 5, 10, 'Self or one willing creature you touch (10 rounds / 10 minutes) adds +1d4 to its next STR or CON check or CON save, and can hold its breath 10 times as long. Ends once the die is used. Once per creature per short rest. Die: 1d6 at 5, 1d8 at 11, 1d10 at 17.', 'bless', 'Body', 'Blue', NULL, NULL, NULL, 'bonus'),
  ('Vein Snare', 1, 30, 1, 'One creature you can see makes a CON save. On a failure it takes 1d4 necrotic and its speed drops by 10 ft until the end of its next turn; on a success nothing happens. Creatures without blood are immune. 2d4 at 5, 3d4 at 11, 4d4 at 17.', 'bind', 'Blood', 'Orange', '1d4', 'CON', NULL, 'action'),
  ('Grit Spit', 1, 30, 0, 'Make a ranged spell attack: 1d8 bludgeoning. 2d8 at 5, 3d8 at 11, 4d8 at 17.', 'evoke', 'Stone', 'Red', '1d8', NULL, 'ranged', 'action'),
  ('Frost Punch', 1, 5, 0, 'Melee spell attack: 1d8 cold. 2d8 at 5, 3d8 at 11, 4d8 at 17. (Provisional: mirrors Spark Grip until the handbook sets its mechanics.)', 'evoke', 'Frost', 'Purple', '1d8', NULL, 'melee', 'action')
) AS v(name, ct, rng, dur, descr, st, el, col, dice, save, atk, act)
WHERE NOT EXISTS (SELECT 1 FROM spells s WHERE s.name = v.name AND s.base_level = 0);

-- Draft spells get their mechanics
UPDATE spells SET casting_time = NULL, range = 5, duration = 0, action_type = 'other', heal_dice = '1d4', heal_add_mod = false,
  base_description = 'Casting time 1 minute. Needs herbs nearby (a pinch from a pack counts). Bind a living creature with a herbal wrap: it regains 1d4 HP, or a dying creature becomes stable. Once per creature per short rest. No effect on undead or constructs. 2d4 at 5, 3d4 at 11, 4d4 at 17.'
WHERE id = 577 AND name = 'Herb Poultice' AND heal_dice IS DISTINCT FROM '1d4';
UPDATE spells SET casting_time = 1, range = 5, duration = 1, action_type = 'reaction',
  base_description = 'Reaction, when you or a creature within 5 ft is hit by an attack. The target gains +2 AC against the triggering attack (which can turn it into a miss) until the start of your next turn. If an attack still hits the target, the pebbles scatter and the spell ends. +3 at 5, +4 at 11, +5 at 17.'
WHERE id = 585 AND name = 'Pebble Shield' AND action_type IS DISTINCT FROM 'reaction';

-- fixed starters for the races that were waiting on these spells (Lupine covers every breed)
UPDATE races r SET race_spell_id = s.id
FROM (VALUES ('Cindral','Ember Spark'),('Saltborn','Bend Water'),('Lupine','Breath Iron'),('Gehennan','Vein Snare')) AS m(race, spell)
JOIN spells s ON s.name = m.spell AND s.base_level = 0
WHERE r.name = m.race AND r.race_spell_id IS DISTINCT FROM s.id;

COMMIT;
