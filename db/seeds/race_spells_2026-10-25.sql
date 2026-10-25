-- Race starter spells (2026-10-25). Idempotent, single transaction. Source: handbook rules/03-races.md + new-starter-spells.md.
BEGIN;

ALTER TABLE races ADD COLUMN IF NOT EXISTS race_spell_id integer REFERENCES spells(id);

-- New level-0 starters not yet in the DB (stored like Knuckle Crack / Spark Grip). Duration is in turns (1 minute = 10); longer durations live in the description.
INSERT INTO spells (name, casting_time, range, duration, base_level, base_description, state_id, element_id, alignment_id, base_damage_dice, opponent_save_roll, attack_type, action_type, heal_add_mod, color)
SELECT v.name, v.ct, v.rng, v.dur, 0, v.descr,
       (SELECT id FROM spell_state WHERE lower(name) = v.st),
       (SELECT id FROM spell_element WHERE name = v.el),
       (SELECT id FROM spell_alignment WHERE "Name" = v.col || ' Magic'),
       v.dice, v.save, NULL, v.act, false, v.col
FROM (VALUES
  ('Frostcut Pebble', 1, 5, NULL::numeric, 'Make a fist-sized stone or ice tool (wedge, hook, key blank) that lasts until your next long rest.', 'create', 'Stone', 'Grey', NULL, NULL, 'action'),
  ('Hearthstone', NULL, 5, NULL, 'Casting time 1 minute. Make a palm-sized stone that stays warm (or burns with a candle flame) for 8 hours.', 'create', 'Stone', 'Grey', NULL, NULL, 'other'),
  ('Gloomrot', 1, 60, 0, 'One creature makes a WIS save or takes 1d6 necrotic and has -1d4 on its next attack (2d6 at 5, 3d6 at 11, 4d6 at 17).', 'curse', 'Shade', 'Purple', '1d6', 'WIS', 'action'),
  ('Whisper Wind', 1, 30, 10, 'Create a sound or a puff of shaped mist up to a 5-ft cube for 1 minute; a Searching check against your spell DC reveals it.', 'illusion', 'Gale', 'Grey', NULL, NULL, 'action'),
  ('Soulmirage', 1, 30, 10, 'A faint, ghostly image of a creature or object up to 5 ft for 1 minute; it can''t make sound. Searching against your DC reveals it.', 'illusion', 'Spirit', 'Grey', NULL, NULL, 'action'),
  ('Shadow Double', 1, 0, 1, 'A shadowy copy of you shimmers for 1 round; the next attack against you has disadvantage.', 'illusion', 'Shade', 'Grey', NULL, NULL, 'bonus'),
  ('Spirit Latch', 1, 5, NULL, 'Seal a door, box or window for 1 hour; spirits can''t pass it, and opening it takes a DC 12 Might check.', 'seal', 'Spirit', 'Blue', NULL, NULL, 'action'),
  ('Starmend', 1, 5, 0, 'A creature regains 1 HP, or a dying creature becomes stable. Once per creature per short rest.', 'restore', 'Star', 'White', NULL, NULL, 'action')
) AS v(name, ct, rng, dur, descr, st, el, col, dice, save, act)
WHERE NOT EXISTS (SELECT 1 FROM spells s WHERE s.name = v.name AND s.base_level = 0);

-- Race -> starter spell. Human and Wyrmkin choose at creation; Cindral, Saltborn, Lupine and Gehennan are left NULL (see report).
UPDATE races r SET race_spell_id = s.id
FROM (VALUES ('Uron','Oakheart Cudgel'),('Umber Elf','Frostcut Pebble'),('Ochre Elf','Herb Poultice'),('Sable Elf','Gloomrot'),('Dwarf','Hearthstone'),('Gnome','Whisper Wind'),('Hollowkin','Spirit Latch'),('Rootborn','Herb Poultice'),('Vellari','Soulmirage'),('Wyrdling','Shadow Double'),('Lumenwing','Oakheart Cudgel'),('Graniar','Pebble Shield'),('Corvani','Ride the Wind'),('Quillary','Wildsign'),('Radiant','Starmend'),('Skyborn','Ride the Wind'),('Orc','Knuckle Crack')) AS m(race, spell)
JOIN spells s ON s.name = m.spell AND s.base_level = 0
WHERE r.name = m.race AND r.race_spell_id IS DISTINCT FROM s.id;

COMMIT;