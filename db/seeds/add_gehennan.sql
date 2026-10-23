-- Gehennan race + 4 Vein Lines (locked by Gabriel 2026-10-16). Idempotent.
BEGIN;
-- New spell alignment: Orange Magic (Hinder), opposite of Yellow
INSERT INTO spell_alignment (id, "Name", "Type") VALUES (9, 'Orange Magic', 'Hinder')
ON CONFLICT (id) DO UPDATE SET "Name" = EXCLUDED."Name", "Type" = EXCLUDED."Type";
SELECT setval(pg_get_serial_sequence('spell_alignment','id'), GREATEST((SELECT MAX(id) FROM spell_alignment), 1), true)
WHERE pg_get_serial_sequence('spell_alignment','id') IS NOT NULL;

-- Sub-races can carry a spell alignment (Vein Lines)
ALTER TABLE subraces ADD COLUMN IF NOT EXISTS spell_alignment_id INTEGER REFERENCES spell_alignment(id) ON DELETE SET NULL;

SELECT setval(pg_get_serial_sequence('races','id'), COALESCE((SELECT MAX(id) FROM races),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_traits','id'), COALESCE((SELECT MAX(id) FROM race_traits),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_lineage_bonuses','id'), COALESCE((SELECT MAX(id) FROM race_lineage_bonuses),0)+1, false);

INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Gehennan', 'Humanoid', 'People born with devil blood, each bloodline believed to descend from a devil house of Gehenna. Glowing grooves mark their skin, and their irises share the color of the dark magic in their veins: red, purple, gold, or orange. They do not age and die only if struck down. Atheria''s paladins persecute them on sight.', 'Medium', 30, 'By Vein Line', true, '/races/gehennan.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Gehennan');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Gehennan' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);

INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, v.name, v.description, v.skill, v.bonus, v.level, v.action_type, v.uses, v.dice
FROM races r JOIN (VALUES
 ('Ageless Blood', 'You don''t age and can''t die of old age, and magic can''t age you.', NULL, NULL::int, 1, NULL, 'Passive', NULL),
 ('Kin-Sense', '+2 to Insight. You also know whether a creature you can see within 30 ft is a devil or is bound to one.', 'Insight', 2, 1, NULL, 'Passive', NULL),
 ('Vein Line', 'Choose your vein color at character creation. It sets your eye and marking color, your resistance, and your Veinfire. Red: fire. Purple: psychic. Gold: force. Orange: acid.', NULL, NULL, 1, NULL, 'Passive', NULL),
 ('Veinfire', 'Your grooves and eyes flare. The next time you hit a creature before the end of your turn, deal an extra 1d6 damage of your Vein Line''s type, plus its rider. The die becomes 2d6 at level 10. Red: the target takes 1d4 fire at the start of its next turn. Purple: the target has disadvantage on its next save against you before the end of your next turn. Gold: you gain temporary HP equal to your proficiency bonus. Orange: the target''s speed drops by 10 ft until the end of its next turn.', NULL, NULL, 1, 'bonus', '1 per short rest', '1d6'),
 ('Devil''s Endurance', 'When you take damage, reduce it by 1d10 + your level.', NULL, NULL, 5, 'reaction', '1 per long rest', '1d10')
) AS v(name, description, skill, bonus, level, action_type, uses, dice) ON r.name = 'Gehennan'
WHERE NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = v.name);

INSERT INTO subraces (race_id, name, slug, description, img_url, spell_alignment_id)
SELECT r.id, v.name, v.slug, v.description, v.img_url, v.al
FROM races r JOIN (VALUES
 ('Wrathveined', 'wrathveined', 'Red veins, Red Magic (Offense). Resistance to fire damage. Veinfire deals fire; the target takes 1d4 fire at the start of its next turn.', '/races/gehennan-red.png', 2),
 ('Dusk-veined', 'dusk-veined', 'Purple veins, Purple Magic (Weaken). Resistance to psychic damage. Veinfire deals psychic; the target has disadvantage on its next save against you.', '/races/gehennan-purple.png', 5),
 ('Oathveined', 'oathveined', 'Gold veins, Yellow Magic (Strengthen). Resistance to force damage. Veinfire deals force; you gain temporary HP equal to your proficiency bonus.', '/races/gehennan-gold.png', 4),
 ('Rustveined', 'rustveined', 'Orange veins, Orange Magic (Hinder). Resistance to acid damage. Veinfire deals acid; the target''s speed drops by 10 ft.', '/races/gehennan-orange.png', 9)
) AS v(name, slug, description, img_url, al) ON r.name = 'Gehennan'
ON CONFLICT (race_id, slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, img_url = EXCLUDED.img_url, spell_alignment_id = EXCLUDED.spell_alignment_id;
COMMIT;
SELECT r.name, s.name AS subrace, s.spell_alignment_id FROM subraces s JOIN races r ON r.id = s.race_id WHERE r.name = 'Gehennan' ORDER BY s.id;
