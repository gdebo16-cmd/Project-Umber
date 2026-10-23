-- Add 7 new Eldridia races (2026-10-14). Idempotent.
BEGIN;
-- Resync id sequences (existing rows were seeded with explicit ids)
SELECT setval(pg_get_serial_sequence('races','id'), COALESCE((SELECT MAX(id) FROM races),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_traits','id'), COALESCE((SELECT MAX(id) FROM race_traits),0)+1, false);
SELECT setval(pg_get_serial_sequence('race_lineage_bonuses','id'), COALESCE((SELECT MAX(id) FROM race_lineage_bonuses),0)+1, false);

-- Sable Elf
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Sable Elf', 'Humanoid', 'Elves of Sable, the primordial dragon of death. Black-skinned with bright purple-to-indigo eyes and a faint spectral shimmer, they walk calmly at the edge between life and its ending.', 'Medium', 30, 'Necrotic', true, '/races/sable-elf.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Sable Elf');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Sable Elf' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Deathsight', 'You can see invisible spirits and undead within 30 ft.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Sable Elf' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Deathsight');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Grave Calm', 'Advantage on saves against being frightened.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Sable Elf' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Grave Calm');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Spectral Step', 'Teleport up to 15 ft to an unoccupied space you can see.', NULL, NULL, 1, 'bonus', '1 per short rest', NULL FROM races r
WHERE r.name = 'Sable Elf' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Spectral Step');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Veil of Sable', 'When you take bludgeoning, piercing, or slashing damage, halve that damage.', NULL, NULL, 5, 'reaction', '1 per long rest', NULL FROM races r
WHERE r.name = 'Sable Elf' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Veil of Sable');

-- Hollowkin
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Hollowkin', 'Humanoid', 'Survivors of Hollow exposure. Gaunt, with pale gray eyes and patches of their bodies gone hollow, they carry something empty inside them that the living find unsettling.', 'Medium', 30, 'Necrotic', true, '/races/hollowkin.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Hollowkin');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Hollowkin' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Emptied Vessel', 'Advantage on saves against disease and poison.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Hollowkin' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Emptied Vessel');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Unfed', 'You don''t need to eat or drink for up to 7 days.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Hollowkin' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Unfed');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Hollow Stare', 'One creature within 30 ft makes a WIS save (DC 8 + PB + CHA) or is frightened until the end of your next turn.', NULL, NULL, 1, 'bonus', '1 per short rest', NULL FROM races r
WHERE r.name = 'Hollowkin' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Hollow Stare');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Hollow Hunger', 'When you hit a creature with an attack, gain temporary HP equal to 1d6 + your level.', NULL, NULL, 5, NULL, '1 per short rest', '1d6' FROM races r
WHERE r.name = 'Hollowkin' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Hollow Hunger');

-- Rootborn
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Rootborn', 'Plant', 'Folk grown from the roots of the Tree of Life. Bark-skinned, with leaves for hair, they are slow, patient, and hard to move.', 'Medium', 25, 'Poison', false, '/races/rootborn.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Rootborn');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Rootborn' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Barkskin', 'When you aren''t wearing armor, your AC is 13 + DEX modifier. You can still use a shield.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Rootborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Barkskin');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Rooted', 'Advantage on checks and saves against being shoved, moved against your will, or knocked prone.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Rootborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Rooted');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Sunmend', 'While in sunlight, regain 1d8 + your level HP.', NULL, NULL, 1, 'action', '1 per long rest', '1d8' FROM races r
WHERE r.name = 'Rootborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Sunmend');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Nature Kin', '+2 to Nature.', 'Nature', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Rootborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Nature Kin');

-- Cindral
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Cindral', 'Humanoid', 'Ember-skinned people of Caldera''s volcanic south, with cracks of molten light in their skin. They are cousins of the dragonborn, not dragon-blooded themselves.', 'Medium', 30, 'Fire', true, '/races/cindral.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Cindral');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Cindral' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Heatborn', 'You ignore the effects of extreme heat.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Cindral' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Heatborn');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Ember Touch', 'When you hit with a melee attack, deal an extra 1d6 fire damage.', NULL, NULL, 1, NULL, '1 per short rest', '1d6' FROM races r
WHERE r.name = 'Cindral' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Ember Touch');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Flare', 'Creatures within 5 ft of you make a CON save or are blinded until the end of your next turn.', NULL, NULL, 3, 'action', '1 per long rest', NULL FROM races r
WHERE r.name = 'Cindral' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Flare');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Molten Veins', 'When a creature within 5 ft hits you with a melee attack, it takes 1d4 fire damage.', NULL, NULL, 5, 'reaction', 'At will', '1d4' FROM races r
WHERE r.name = 'Cindral' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Molten Veins');

-- Vellari
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Vellari', 'Humanoid', 'Lean, fox-like people of the Wildlands. They are quick, curious, and natural trackers.', 'Small to medium', 35, 'none', true, '/races/vellari.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Vellari');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Vellari' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Keen Nose', '+2 to Survival. Advantage on checks to track by scent.', 'Survival', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Vellari' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Keen Nose');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Quickfoot', 'Take the Disengage action.', NULL, NULL, 1, 'bonus', '1 per short rest', NULL FROM races r
WHERE r.name = 'Vellari' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Quickfoot');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Pounce', 'If you move at least 20 ft straight toward a creature and then hit it with a melee attack on the same turn, deal an extra 1d6 damage.', NULL, NULL, 3, NULL, '1 per short rest', '1d6' FROM races r
WHERE r.name = 'Vellari' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Pounce');

-- Saltborn
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Saltborn', 'Humanoid', 'Blue-gray coastal people of Atheria''s shores, with webbed hands and gill marks. They are sailors and traders by trade.', 'Medium', 30, 'Cold', false, '/races/saltborn.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Saltborn');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Saltborn' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Amphibious', 'You can breathe air and water, and you have a 30 ft swim speed.', NULL, NULL, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Saltborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Amphibious');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Deckhand', '+2 to Athletics.', 'Athletics', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Saltborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Deckhand');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Trader''s Tongue', '+2 to Persuasion.', 'Persuasion', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Saltborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Trader''s Tongue');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Tidecall', 'A 15 ft line of water pushes each creature in it 10 ft away from you. A STR save negates the push.', NULL, NULL, 3, 'action', '1 per long rest', NULL FROM races r
WHERE r.name = 'Saltborn' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Tidecall');

-- Wyrdling
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Wyrdling', 'Fey', 'Small, moth-winged fae folk with glowing eyes. They drift around ruins and old magic.', 'Small', 25, 'none', true, '/races/wyrdling.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Wyrdling');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, r.creature_type, r.size, r.base_speed, r.resistances, r.darkvision FROM races r
WHERE r.name = 'Wyrdling' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Arcana Kin', '+2 to Arcana.', 'Arcana', 2, 1, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Wyrdling' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Arcana Kin');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Old Magic Sense', 'Sense the presence and location of magic within 30 ft until the end of your next turn.', NULL, NULL, 1, 'action', '1 per short rest', NULL FROM races r
WHERE r.name = 'Wyrdling' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Old Magic Sense');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Dust Veil', 'Become invisible until the end of your next turn, or until you attack or cast a spell.', NULL, NULL, 3, 'bonus', '1 per long rest', NULL FROM races r
WHERE r.name = 'Wyrdling' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Dust Veil');
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Moth Wings', 'You have a 30 ft flying speed while wearing light armor or no armor. You can''t fly while carrying more than half your carrying capacity.', NULL, NULL, 5, NULL, 'Passive', NULL FROM races r
WHERE r.name = 'Wyrdling' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Moth Wings');

COMMIT;
