-- Add 5 new Eldridia races, batch 2 (2026-10-15). Idempotent.
BEGIN;
-- Resync id sequences (existing rows were seeded with explicit ids)
SELECT setval(pg_get_serial_sequence('races','id'), COALESCE((SELECT MAX(id) FROM races),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_traits','id'), COALESCE((SELECT MAX(id) FROM race_traits),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_lineage_bonuses','id'), COALESCE((SELECT MAX(id) FROM race_lineage_bonuses),0)+1, false);

-- Lumenwing
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Lumenwing', 'Fey', 'Slender butterfly fae with large, brilliant wings whose patterns are unique to each one, like a fingerprint. Unlike the moth-winged Wyrdlings of the ruins, Lumenwings are sunlit folk of flowering groves: dazzling, flighty, and drawn to color and life.', 'Small to medium', 30, 'Radiant', false, '/races/lumenwing.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Lumenwing');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Lumenwing' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Dazzling Wings', 'One creature within 15 ft that can see you makes a CON save or is blinded until the end of your next turn.', NULL, NULL, 1, 'bonus', '1 per long rest', NULL FROM races r
WHERE r.name = 'Lumenwing' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Dazzling Wings');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Bloomtouch', 'Touch a creature to restore 1d6 + your level HP.', NULL, NULL, 1, 'action', '1 per long rest', '1d6' FROM races r
WHERE r.name = 'Lumenwing' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Bloomtouch');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Grace', '+2 to Performance.', 'Performance', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Lumenwing' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Grace');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Butterfly Flight', '30 ft flying speed while wearing light or no armor and not carrying a heavy load.', NULL, NULL, 5, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Lumenwing' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Butterfly Flight');

-- Graniar
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Graniar', 'Humanoid', 'Tall, slow mountain folk who look carved from living granite. They live for centuries and forget nothing.', 'Large', 25, 'none', true, '/races/graniar.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Graniar');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Graniar' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Granite Body', 'When you take damage, reduce it by 1d8 + your CON modifier.', NULL, NULL, 1, 'reaction', '1 per short rest', '1d8' FROM races r
WHERE r.name = 'Graniar' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Granite Body');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Unmoving', 'Advantage on saves and checks against being shoved, knocked prone, or moved.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Graniar' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Unmoving');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Long Memory', '+2 to History.', 'History', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Graniar' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Long Memory');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Stoneskin', 'Gain resistance to bludgeoning, piercing, and slashing damage until the end of your next turn.', NULL, NULL, 5, 'bonus', '1 per long rest', NULL FROM races r
WHERE r.name = 'Graniar' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Stoneskin');

-- Corvani
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Corvani', 'Humanoid', 'Raven-feathered humanoids who carry messages, trade in secrets, and are said to keep watch over the dead.', 'Medium', 30, 'Necrotic', true, '/races/corvani.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Corvani');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Corvani' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Mimicry', '+2 to Deception. You can perfectly mimic any voice or sound you have heard. A listener can see through it with an Insight check against your Deception.', 'Deception', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Corvani' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Mimicry');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Secret Keeper', '+2 to Investigation.', 'Investigation', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Corvani' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Secret Keeper');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Deathwatch', 'Sense whether a creature within 30 ft is dying, undead, or recently dead.', NULL, NULL, 1, 'action', '1 per short rest', NULL FROM races r
WHERE r.name = 'Corvani' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Deathwatch');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Gliding Wings', 'Fall no faster than 60 ft per round, take no falling damage, and glide 2 ft horizontally for every 1 ft you fall.', NULL, NULL, 3, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Corvani' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Gliding Wings');

-- Quillary
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Quillary', 'Humanoid', 'Hedgehog-like small folk with spines down their backs. They are stubborn burrowers who are very hard to grab.', 'Small', 25, 'none', true, '/races/quillary.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Quillary');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Quillary' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Spines', 'A creature that grapples you or hits you with an unarmed strike takes 1d4 piercing damage.', NULL, NULL, 1, NULL, 'Passive', '1d4' FROM races r
WHERE r.name = 'Quillary' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Spines');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Curl Up', 'When you are attacked, gain +2 AC until the start of your next turn, but your speed becomes 0.', NULL, NULL, 1, 'reaction', '1 per short rest', NULL FROM races r
WHERE r.name = 'Quillary' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Curl Up');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Burrower', '10 ft burrowing speed through loose earth and sand.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Quillary' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Burrower');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Stubborn', 'Advantage on saves against being charmed or frightened.', NULL, NULL, 3, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Quillary' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Stubborn');

-- Lupine
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Lupine', 'Humanoid', 'Loyal dog folk who live in packs, with looks that follow their breed lines. A Lupine might be a sturdy mastiff, a lean greyhound, a fluffy husky, a powerful rottweiler, a shepherd, or a hound.', 'Medium', 30, 'none', false, '/races/lupine.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Lupine');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Lupine' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Keen Senses', '+2 to Perception. Advantage on smell-based checks.', 'Perception', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Lupine' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Keen Senses');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Pack Loyalty', 'When a creature you can see attacks an ally within 5 ft of you, impose disadvantage on that attack roll.', NULL, NULL, 1, 'reaction', '1 per short rest', NULL FROM races r
WHERE r.name = 'Lupine' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Pack Loyalty');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Breed Line', 'Choose a breed at character creation. Mastiff: +1 HP per level. Greyhound: +10 ft speed. Husky: cold resistance. Rottweiler: bite 1d6 + STR (bonus action, 1 per short rest). Shepherd: +2 Insight. Hound: track by scent across up to a day-old trail.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Lupine' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Breed Line');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Howl', 'Allies within 30 ft who can hear you gain 1d4 temporary HP and advantage on their next save against fear.', NULL, NULL, 3, 'bonus', '1 per long rest', '1d4' FROM races r
WHERE r.name = 'Lupine' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Howl');

COMMIT;
