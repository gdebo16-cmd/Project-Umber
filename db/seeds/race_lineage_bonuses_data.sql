-- race_lineage_bonuses: Codex draft approved by Gabriel 2026-10-12. Safe to re-run.
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice) VALUES
((SELECT id FROM races WHERE name = 'Human'), 'Jack of Trades', 'Gain proficiency in one skill of your choice.', '(choice)', NULL, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Human'), 'Practiced', '+1 to one skill you are already proficient in.', '(choice)', 1, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Human'), 'Second Wind of Will', 'Reroll one failed ability check or save; must use the new roll.', NULL, NULL, 1, 'reaction', '1 per long rest', NULL),
((SELECT id FROM races WHERE name = 'Uron'), 'Bear Claws', 'Your claws are natural weapons dealing 1d6 slashing; use STR.', NULL, NULL, 1, 'action', 'At will', '1d6'),
((SELECT id FROM races WHERE name = 'Uron'), 'Hulking Grip', '+2 to Athletics. Count as one size larger for carrying, pushing, and grapples.', 'Athletics', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Uron'), 'Mauling Roar', 'Creatures of your choice within 15 ft make a WIS save (DC 8+PB+CON) or are frightened until the end of your next turn.', NULL, NULL, 3, 'bonus', '1 per short rest', NULL),
((SELECT id FROM races WHERE name = 'Ochre Elf'), 'Wildborn', '+2 to Nature.', 'Nature', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Ochre Elf'), 'Green Sight', 'Advantage on Survival checks to track and on Perception checks in forests or wilds.', NULL, NULL, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Ochre Elf'), 'Rootbind', 'One creature within 30 ft makes a STR save (DC 8+PB+WIS) or is restrained by roots until the end of your next turn.', NULL, NULL, 3, 'action', '1 per long rest', NULL),
((SELECT id FROM races WHERE name = 'Umber Elf'), 'Mountain-Born', '+2 to Athletics when climbing; ignore difficult terrain from snow, ice, or rock.', 'Athletics', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Umber Elf'), 'Stone Sense', '+2 to Perception.', 'Perception', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Umber Elf'), 'Red Gaze', 'One creature within 30 ft makes a WIS save (DC 8+PB+CHA) or has disadvantage on its next attack against you.', NULL, NULL, 1, 'bonus', '1 per short rest', NULL),
((SELECT id FROM races WHERE name = 'Dragonborn'), 'Fire Breath', '15-ft cone, DEX save (DC 8+PB+CON), fire damage, half on success. Damage rises to 3d6 at 5, 4d6 at 11, 5d6 at 17.', NULL, NULL, 1, 'action', '1 per short rest', '2d6'),
((SELECT id FROM races WHERE name = 'Dragonborn'), 'Draconic Presence', '+2 to Intimidation.', 'Intimidation', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Dragonborn'), 'Scaled Hide', 'When not wearing armor, AC = 13 + DEX modifier.', NULL, NULL, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Dwarf'), 'Toolwise', 'Proficiency with two tools of your choice; add double proficiency with one.', NULL, NULL, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Dwarf'), 'Sea Legs', '+2 to Acrobatics on ships or unstable footing; swim speed equal to walking speed.', 'Acrobatics', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Dwarf'), 'Quick Fix', 'Repair a broken object or give a creature 1d6 temp HP by patching gear.', NULL, NULL, 1, 'bonus', '1 per short rest', '1d6'),
((SELECT id FROM races WHERE name = 'Gnome'), 'Nimble Fingers', '+2 to Sleight of Hand.', 'Sleight of Hand', 2, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Gnome'), 'Squeeze Through', 'Move through spaces as small as 6 inches without slowing down; can move through larger creatures'' spaces.', NULL, NULL, 1, NULL, 'Passive', NULL),
((SELECT id FROM races WHERE name = 'Gnome'), 'Slip Away', 'Disengage or Hide as a bonus action.', NULL, NULL, 1, 'bonus', 'At will', NULL)
ON CONFLICT (race_id, name) DO UPDATE SET description = EXCLUDED.description, skill = EXCLUDED.skill, bonus = EXCLUDED.bonus, level = EXCLUDED.level, action_type = EXCLUDED.action_type, uses = EXCLUDED.uses, dice = EXCLUDED.dice;
