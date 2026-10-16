-- Add 2 new Eldridia races, batch 3: Radiant, Skyborn (approved 2026-10-15/16). Idempotent.
BEGIN;
-- Resync id sequences (existing rows were seeded with explicit ids)
SELECT setval(pg_get_serial_sequence('races','id'), COALESCE((SELECT MAX(id) FROM races),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_traits','id'), COALESCE((SELECT MAX(id) FROM race_traits),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_lineage_bonuses','id'), COALESCE((SELECT MAX(id) FROM race_lineage_bonuses),0)+1, false);

-- Radiant
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Radiant', 'Humanoid', 'Folk born with starlight in their blood. Seams of living gold light run beneath their skin like veins of ore, and the light flares brighter with emotion. Eldridian lore says the first Radiants were born where falling stars struck the earth. They have no wings; their gift is inner light. They are warm, steady protectors who see it as their duty to stand where the dark is deepest.', 'Medium', 30, 'Radiant', false, '/races/radiants.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Radiant');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Radiant' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Inner Light', 'Your veins shed dim light in a 10 ft radius. As a bonus action, you can make it bright light or dim it completely.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Radiant' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Inner Light');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Kindle', 'When you hit a creature, deal an extra 1d6 radiant damage. The die becomes 2d6 at level 10.', NULL, NULL, 1, NULL, '1 per short rest', '1d6' FROM races r
WHERE r.name = 'Radiant' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Kindle');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Steady Glow', '+2 to Insight.', 'Insight', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Radiant' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Steady Glow');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Starflare', 'Your light bursts out. Each hostile creature within 10 ft makes a CON save or is blinded until the end of your next turn, and you gain temporary HP equal to your level.', NULL, NULL, 5, 'action', '1 per long rest', NULL FROM races r
WHERE r.name = 'Radiant' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Starflare');

-- Skyborn
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Skyborn', 'Humanoid', 'Pale-blue folk with storm-white hair that is never still, even when the air is calm. They are said to be children of the high winds above Eldridia''s clouds, carried down to the world on the first storm. Skyborn are wingless; the wind itself lifts them. Cheerful, restless wanderers and rescuers, they believe no one should ever be left behind.', 'Medium', 35, 'Lightning', false, '/races/skyborn.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Skyborn');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Skyborn' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Featherfall', 'Fall no faster than 60 ft per round and take no falling damage.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Skyborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Featherfall');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Gust', 'Push a creature within 15 ft up to 10 ft away from you (STR save negates), or move yourself 10 ft without provoking opportunity attacks.', NULL, NULL, 1, 'bonus', '1 per short rest', NULL FROM races r
WHERE r.name = 'Skyborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Gust');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Windreader', '+2 to Perception.', 'Perception', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Skyborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Windreader');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Windborne Flight', 'The wind lifts you, giving you a 30 ft flying speed for 1 minute. You must wear light or no armor. At level 10 this becomes permanent while you wear light or no armor.', NULL, NULL, 5, 'bonus', '1 per long rest', NULL FROM races r
WHERE r.name = 'Skyborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Windborne Flight');

COMMIT;
