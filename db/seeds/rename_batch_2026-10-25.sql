-- Rename batch 2026-10-25 (Kilnflame, Iron Leash, Deep Debt, Hexstorm, Pugilist Grit, Wyrmkin, L20 titles, Orc). Idempotent: safe to re-run.
BEGIN;

-- Spell Forge Fire -> Kilnflame
UPDATE spells SET name = 'Kilnflame' WHERE name = 'Forge Fire';

-- Reaver L13 Steady Forge -> Iron Leash; L21 Bottomless Forge -> Deep Debt
UPDATE class_features SET name = 'Iron Leash' WHERE class_id = 16 AND name = 'Steady Forge';
UPDATE class_features SET name = 'Deep Debt' WHERE class_id = 16 AND name = 'Bottomless Forge';
UPDATE class_levels SET description = replace(replace(description, 'Steady Forge', 'Iron Leash'), 'Bottomless Forge', 'Deep Debt')
WHERE class_id = 16 AND (description LIKE '%Steady Forge%' OR description LIKE '%Bottomless Forge%');

-- Witch Knight L28 Warlock of the Field -> Hexstorm
UPDATE subclass_features SET name = 'Hexstorm' WHERE name = 'Warlock of the Field';
UPDATE subclass_levels SET description = replace(description, 'Warlock of the Field', 'Hexstorm') WHERE description LIKE '%Warlock of the Field%';

-- Pugilist resource Focus -> Grit (Pugilist class 10 and its subclasses only)
UPDATE class_levels SET description = regexp_replace(description, '\mFocus\M', 'Grit', 'g'), resources = regexp_replace(resources, '\mFocus\M', 'Grit', 'g')
WHERE class_id = 10 AND (description ~ '\mFocus\M' OR resources ~ '\mFocus\M');
UPDATE class_features SET name = regexp_replace(name, '\mFocus\M', 'Grit', 'g'), description = regexp_replace(description, '\mFocus\M', 'Grit', 'g'), uses = regexp_replace(uses, '\mFocus\M', 'Grit', 'g')
WHERE class_id = 10 AND (name ~ '\mFocus\M' OR description ~ '\mFocus\M' OR uses ~ '\mFocus\M');
UPDATE class_feature_options SET description = regexp_replace(description, '\mFocus\M', 'Grit', 'g'), uses = regexp_replace(uses, '\mFocus\M', 'Grit', 'g')
WHERE class_id = 10 AND (description ~ '\mFocus\M' OR uses ~ '\mFocus\M');
UPDATE subclass_features SET description = regexp_replace(description, '\mFocus\M', 'Grit', 'g'), uses = regexp_replace(uses, '\mFocus\M', 'Grit', 'g')
WHERE subclass_id IN (SELECT id FROM sub_classes WHERE class_id = 10) AND (description ~ '\mFocus\M' OR uses ~ '\mFocus\M');

-- Race Dragonborn -> Wyrmkin
UPDATE races SET name = 'Wyrmkin', img_url = '/races/wyrmkin.png' WHERE name = 'Dragonborn';
UPDATE races SET traits = replace(traits, 'dragonborn', 'wyrmkin') WHERE traits LIKE '%dragonborn%';

-- L20 class titles (locked 2026-10-25)
UPDATE classes SET titles = 'L20 Champion; L30 Apex Warrior' WHERE name = 'Warrior';
UPDATE classes SET titles = 'L20 Archmage; L30 Apex Mage' WHERE name = 'Mage';
UPDATE classes SET titles = 'L20 High Paladin; L30 Arch Paladin' WHERE name = 'Paladin';
UPDATE classes SET titles = 'L20 Master Assassin; L30 Apex Assassin' WHERE name = 'Assassin';
UPDATE classes SET titles = 'L20 Knight Commander; L30 Apex Knight' WHERE name = 'Knight';
UPDATE classes SET titles = 'L20 Warden; L30 Apex Ranger' WHERE name = 'Ranger';
UPDATE classes SET titles = 'L20 Ragebound; L30 Wrathborn (Mythic Rage)' WHERE name = 'Berserker';
UPDATE classes SET titles = 'L20 Master; L30 Grand Master' WHERE name = 'Pugilist';
UPDATE classes SET titles = 'L20 Wyrmlance; L30 Dragonspear' WHERE name = 'Lancer';

-- Orc (new playable race, locked 2026-10-25)
INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url)
SELECT 'Orc', 'Humanoid', 'Orcs came to Lys under King Barathos, when the kindest of the Alterian kings opened the realm''s borders. They came as workers, soldiers, and settlers, and many earned their place the hard way, through the Second Great War and the long Civil Wars that followed. Strong, broad, and hard to kill, orcs are known in Lys for loyalty to whoever treats them fairly, and long memories for whoever doesn''t. Where they came from before Lys is a story each clan tells differently.', 'Medium', 30, 'Poison', true, '/races/orc.png'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Orc');
INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, 'Humanoid', 'Medium', 30, 'Poison', true FROM races r
WHERE r.name = 'Orc' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, v.name, v.description, v.skill, NULL, v.level, v.action_type, v.uses, v.dice
FROM races r CROSS JOIN (VALUES
  ('Thick-Boned', 'You count as one size larger for carrying, pushing, dragging and lifting, and you have proficiency in Athletics.', 'Athletics', 1, NULL, 'Passive', NULL),
  ('Hard to Fell', 'When you drop to 0 HP but aren''t killed outright, drop to 1 HP instead.', NULL, 1, NULL, '1 per long rest', NULL),
  ('Breaker''s Charge', 'Move up to your speed toward an enemy you can see; your next melee hit this turn deals +1d6.', NULL, 1, 'bonus', '1 per short rest', '1d6'),
  ('Bone-Shaker Roar', 'Each creature of your choice within 15 ft makes a WIS save (DC 8 + PB + CON) or has disadvantage on its next attack before the end of its next turn.', NULL, 5, 'action', '1 per short rest', NULL)
) AS v(name, description, skill, level, action_type, uses, dice)
WHERE r.name = 'Orc' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = v.name);
INSERT INTO race_affinity_elements (race_id, subrace_id, element_id)
SELECT r.id, NULL, e.id FROM races r JOIN spell_element e ON e.name IN ('Body', 'Stone')
WHERE r.name = 'Orc' AND NOT EXISTS (SELECT 1 FROM race_affinity_elements a WHERE a.race_id = r.id AND a.element_id = e.id);

COMMIT;
