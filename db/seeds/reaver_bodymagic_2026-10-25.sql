-- Reaver spells + Body Magic (martial magic), local only. Idempotent: safe to run again.
-- Sources: handbook-2026-10-25 rules/reaver-halfcaster-for-major.md and martial-magic-for-major.md
BEGIN;

-- 1. schema: bonus (always-known) spells on class_spells. Once-per-long-rest Body Magic uses the existing characters.rest_uses (keys body-<spell id>).
ALTER TABLE class_spells ADD COLUMN IF NOT EXISTS is_bonus boolean NOT NULL DEFAULT false;

-- 2. new spells (matched on name + element + level, so the existing L4 Titan's Sinew #107 is left alone)
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Soul Link',0,9,9,5,'Purple','bonus',60,10,NULL,'1d6','Reaver signature cantrip. You link one creature you can see within 60 ft (10 rounds in combat, 1 hour out of combat; no attack or save to place). The first time you hit it with a weapon attack on each of your turns, it takes an extra 1d6 necrotic (1d8 at L5, 1d10 at L11, 2d6 at L17). You have advantage on checks to track or find it. If it drops to 0 HP before the spell ends, you can use a bonus action on a later turn to move the link to a new creature you can see within 60 ft. Only one link at a time; casting it again ends the old one. When you place or move the link, choose one. Weaken: the linked creature subtracts 1d4 from its first attack roll each turn against anyone but you. Strengthen: you gain temporary HP equal to your CHA modifier (minimum 1) each time the extra damage triggers.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Soul Link' AND element_id = 9 AND base_level = 0);
UPDATE spells SET state_id = 9, alignment_id = 5, color = 'Purple', action_type = 'bonus', range = 60, duration = 10, opponent_save_roll = NULL, base_damage_dice = '1d6', base_description = 'Reaver signature cantrip. You link one creature you can see within 60 ft (10 rounds in combat, 1 hour out of combat; no attack or save to place). The first time you hit it with a weapon attack on each of your turns, it takes an extra 1d6 necrotic (1d8 at L5, 1d10 at L11, 2d6 at L17). You have advantage on checks to track or find it. If it drops to 0 HP before the spell ends, you can use a bonus action on a later turn to move the link to a new creature you can see within 60 ft. Only one link at a time; casting it again ends the old one. When you place or move the link, choose one. Weaken: the linked creature subtracts 1d4 from its first attack roll each turn against anyone but you. Strengthen: you gain temporary HP equal to your CHA modifier (minimum 1) each time the extra damage triggers.', casting_time = 1 WHERE name = 'Soul Link' AND element_id = 9 AND base_level = 0;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Pact Vigor',4,8,8,4,'Yellow','bonus',30,10,NULL,NULL,'You and up to 2 allies within 30 ft each gain temporary HP equal to 2d8 + your CHA modifier and add +1d4 to weapon damage rolls for 10 rounds (1 minute). No attack or save. Upcast: +1d8 temporary HP per slot level above 4th.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Pact Vigor' AND element_id = 8 AND base_level = 4);
UPDATE spells SET state_id = 8, alignment_id = 4, color = 'Yellow', action_type = 'bonus', range = 30, duration = 10, opponent_save_roll = NULL, base_damage_dice = NULL, base_description = 'You and up to 2 allies within 30 ft each gain temporary HP equal to 2d8 + your CHA modifier and add +1d4 to weapon damage rolls for 10 rounds (1 minute). No attack or save. Upcast: +1d8 temporary HP per slot level above 4th.', casting_time = 1 WHERE name = 'Pact Vigor' AND element_id = 8 AND base_level = 4;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Infernal Mandate',6,1,8,4,'Yellow','action',30,10,NULL,NULL,'A 30-ft aura around you for 10 rounds (1 minute). Allies in the aura (you included) add +1d6 fire to weapon hits, have advantage on saves against being frightened or charmed, and gain resistance to fire. Enemies that start their turn in the aura take 2d6 fire (no save). The spell ends early if you drop to 0 HP.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Infernal Mandate' AND element_id = 1 AND base_level = 6);
UPDATE spells SET state_id = 8, alignment_id = 4, color = 'Yellow', action_type = 'action', range = 30, duration = 10, opponent_save_roll = NULL, base_damage_dice = NULL, base_description = 'A 30-ft aura around you for 10 rounds (1 minute). Allies in the aura (you included) add +1d6 fire to weapon hits, have advantage on saves against being frightened or charmed, and gain resistance to fire. Enemies that start their turn in the aura take 2d6 fire (no save). The spell ends early if you drop to 0 HP.', casting_time = 1 WHERE name = 'Infernal Mandate' AND element_id = 1 AND base_level = 6;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Iron Pulse',0,16,8,4,'Yellow','bonus',0,1,NULL,NULL,'Body Magic. Your next weapon hit before the spell ends (1 round) deals +1d4 damage of the weapon''s type (1d6 at L11, 1d8 at L17). No attack or save.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0);
UPDATE spells SET state_id = 8, alignment_id = 4, color = 'Yellow', action_type = 'bonus', range = 0, duration = 1, opponent_save_roll = NULL, base_damage_dice = NULL, base_description = 'Body Magic. Your next weapon hit before the spell ends (1 round) deals +1d4 damage of the weapon''s type (1d6 at L11, 1d8 at L17). No attack or save.', casting_time = 1 WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Limb Wither',0,16,9,5,'Purple','action',30,1,'CON','1d6','Body Magic. CON save. On a failed save the target takes 1d6 necrotic (2d6 at L5, 3d6 at L11, 4d6 at L17) and has -1d4 on its next weapon damage roll before the end of its next turn. On a success, nothing happens.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0);
UPDATE spells SET state_id = 9, alignment_id = 5, color = 'Purple', action_type = 'action', range = 30, duration = 1, opponent_save_roll = 'CON', base_damage_dice = '1d6', base_description = 'Body Magic. CON save. On a failed save the target takes 1d6 necrotic (2d6 at L5, 3d6 at L11, 4d6 at L17) and has -1d4 on its next weapon damage roll before the end of its next turn. On a success, nothing happens.', casting_time = 1 WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Hobbling Strike',1,16,9,5,'Purple','bonus',5,10,'CON',NULL,'Body Magic, once per long rest. Bonus action after you hit a creature with a weapon. For 10 rounds (1 minute) its speed is halved and it can''t take reactions. It makes a CON save at the end of each of its turns, ending the effect on a success. Body Magic doesn''t upcast.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1);
UPDATE spells SET state_id = 9, alignment_id = 5, color = 'Purple', action_type = 'bonus', range = 5, duration = 10, opponent_save_roll = 'CON', base_damage_dice = NULL, base_description = 'Body Magic, once per long rest. Bonus action after you hit a creature with a weapon. For 10 rounds (1 minute) its speed is halved and it can''t take reactions. It makes a CON save at the end of each of its turns, ending the effect on a success. Body Magic doesn''t upcast.', casting_time = 1 WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Ironbrawn',3,16,2,4,'Yellow','bonus',0,10,NULL,NULL,'Body Magic, once per long rest. For 10 rounds (1 minute) you grow one size if there''s room, gain advantage on STR checks and saves, your weapon hits deal +1d6, and your reach grows by 5 ft. No attack or save.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3);
UPDATE spells SET state_id = 2, alignment_id = 4, color = 'Yellow', action_type = 'bonus', range = 0, duration = 10, opponent_save_roll = NULL, base_damage_dice = NULL, base_description = 'Body Magic, once per long rest. For 10 rounds (1 minute) you grow one size if there''s room, gain advantage on STR checks and saves, your weapon hits deal +1d6, and your reach grows by 5 ft. No attack or save.', casting_time = 1 WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'War Trance',3,16,8,4,'Yellow','bonus',0,10,NULL,NULL,'Body Magic, once per long rest. You gain temporary HP equal to 2d10 + your level and can''t be frightened for 10 rounds (1 minute). Once per turn, when you miss with a weapon attack, you can reroll it.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3);
UPDATE spells SET state_id = 8, alignment_id = 4, color = 'Yellow', action_type = 'bonus', range = 0, duration = 10, opponent_save_roll = NULL, base_damage_dice = NULL, base_description = 'Body Magic, once per long rest. You gain temporary HP equal to 2d10 + your level and can''t be frightened for 10 rounds (1 minute). Once per turn, when you miss with a weapon attack, you can reroll it.', casting_time = 1 WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3;
INSERT INTO spells (name, base_level, element_id, state_id, alignment_id, color, action_type, range, duration, opponent_save_roll, base_damage_dice, base_description, casting_time, heal_add_mod)
  SELECT 'Unstrung',3,16,9,5,'Purple','action',60,10,'CON','3d8','Body Magic, once per long rest. 60 ft. CON save. On a failure the target takes 3d8 necrotic and for 10 rounds (1 minute) has disadvantage on STR and DEX checks and saves and deals half damage with weapon attacks; it repeats the save at the end of each of its turns, ending it on a success. On a successful initial save it takes half damage and suffers no other effect.', 1, false WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3);
UPDATE spells SET state_id = 9, alignment_id = 5, color = 'Purple', action_type = 'action', range = 60, duration = 10, opponent_save_roll = 'CON', base_damage_dice = '3d8', base_description = 'Body Magic, once per long rest. 60 ft. CON save. On a failure the target takes 3d8 necrotic and for 10 rounds (1 minute) has disadvantage on STR and DEX checks and saves and deals half damage with weapon attacks; it repeats the save at the end of each of its turns, ending it on a success. On a successful initial save it takes half damage and suffers no other effect.', casting_time = 1 WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3;

-- 3. Reaver base list (class 16, no subclass): delete and re-add
DELETE FROM class_spells WHERE class_id = 16 AND subclass_id IS NULL;
INSERT INTO class_spells (class_id, subclass_id, spell_id, min_level, is_bonus) VALUES
  (16, NULL, 261, 2, false),
  (16, NULL, 414, 2, false),
  (16, NULL, 417, 2, false),
  (16, NULL, 70, 2, false),
  (16, NULL, 138, 2, false),
  (16, NULL, 145, 2, false),
  (16, NULL, 278, 2, false),
  (16, NULL, 444, 2, false),
  (16, NULL, 462, 2, false),
  (16, NULL, 487, 2, false),
  (16, NULL, 619, 2, false),
  (16, NULL, 722, 2, false),
  (16, NULL, 731, 2, false),
  (16, NULL, 147, 5, false),
  (16, NULL, 188, 5, false),
  (16, NULL, 215, 5, false),
  (16, NULL, 423, 5, false),
  (16, NULL, 620, 5, false),
  (16, NULL, 141, 9, false),
  (16, NULL, 142, 9, false),
  (16, NULL, 554, 9, false),
  (16, NULL, 723, 9, false),
  (16, NULL, 732, 9, false),
  (16, NULL, 45, 13, false),
  (16, NULL, 168, 13, false),
  (16, NULL, 232, 13, false),
  (16, NULL, 330, 13, false),
  (16, NULL, 176, 17, false),
  (16, NULL, 249, 17, false),
  (16, NULL, 454, 17, false),
  (16, NULL, 218, 21, false),
  (16, NULL, (SELECT id FROM spells WHERE name = 'Pact Vigor' AND element_id = 8 AND base_level = 4), 13, false),
  (16, NULL, (SELECT id FROM spells WHERE name = 'Infernal Mandate' AND element_id = 1 AND base_level = 6), 21, false),
  (16, NULL, (SELECT id FROM spells WHERE name = 'Soul Link' AND element_id = 9 AND base_level = 0), 2, true);

-- 4. Mark of Possession (subclass 52, full caster on Songsmith slots): its 18 spells become always-known bonus spells,
-- unlocked when the Songsmith table first gives that slot level (cantrips and 1st at L1, 2nd L3, 3rd L5, 4th L7)
UPDATE class_spells cs SET is_bonus = true, min_level = CASE s.base_level WHEN 0 THEN 1 WHEN 1 THEN 1 WHEN 2 THEN 3 WHEN 3 THEN 5 WHEN 4 THEN 7 ELSE cs.min_level END FROM spells s WHERE s.id = cs.spell_id AND cs.class_id = 16 AND cs.subclass_id = 52;

-- 5. Body Magic: six martial classes, casting stat per class, one shared pool (no slots; leveled spells once per long rest)
UPDATE classes SET caster_type = 'body', spellcasting_stat = 'STR' WHERE id = 1;
UPDATE classes SET caster_type = 'body', spellcasting_stat = 'DEX' WHERE id = 5;
UPDATE classes SET caster_type = 'body', spellcasting_stat = 'STR' WHERE id = 6;
UPDATE classes SET caster_type = 'body', spellcasting_stat = 'CON' WHERE id = 9;
UPDATE classes SET caster_type = 'body', spellcasting_stat = 'DEX' WHERE id = 10;
UPDATE classes SET caster_type = 'body', spellcasting_stat = 'STR' WHERE id = 11;
DELETE FROM class_spells WHERE class_id IN (1,5,6,9,10,11) AND subclass_id IS NULL;
INSERT INTO class_spells (class_id, subclass_id, spell_id, min_level, is_bonus) VALUES
  (1, NULL, 797, 5, false),
  (1, NULL, (SELECT id FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0), 5, false),
  (1, NULL, (SELECT id FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0), 5, false),
  (1, NULL, 300, 5, false),
  (1, NULL, 15, 5, false),
  (1, NULL, 290, 5, false),
  (1, NULL, 27, 5, false),
  (1, NULL, 273, 5, false),
  (1, NULL, (SELECT id FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1), 5, false),
  (1, NULL, 529, 5, false),
  (1, NULL, 389, 15, false),
  (1, NULL, 213, 15, false),
  (1, NULL, 212, 15, false),
  (1, NULL, 532, 15, false),
  (1, NULL, 528, 15, false),
  (1, NULL, (SELECT id FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3), 25, false),
  (1, NULL, (SELECT id FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3), 25, false),
  (1, NULL, (SELECT id FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3), 25, false),
  (5, NULL, 797, 5, false),
  (5, NULL, (SELECT id FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0), 5, false),
  (5, NULL, (SELECT id FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0), 5, false),
  (5, NULL, 300, 5, false),
  (5, NULL, 15, 5, false),
  (5, NULL, 290, 5, false),
  (5, NULL, 27, 5, false),
  (5, NULL, 273, 5, false),
  (5, NULL, (SELECT id FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1), 5, false),
  (5, NULL, 529, 5, false),
  (5, NULL, 389, 15, false),
  (5, NULL, 213, 15, false),
  (5, NULL, 212, 15, false),
  (5, NULL, 532, 15, false),
  (5, NULL, 528, 15, false),
  (5, NULL, (SELECT id FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3), 25, false),
  (5, NULL, (SELECT id FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3), 25, false),
  (5, NULL, (SELECT id FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3), 25, false),
  (6, NULL, 797, 5, false),
  (6, NULL, (SELECT id FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0), 5, false),
  (6, NULL, (SELECT id FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0), 5, false),
  (6, NULL, 300, 5, false),
  (6, NULL, 15, 5, false),
  (6, NULL, 290, 5, false),
  (6, NULL, 27, 5, false),
  (6, NULL, 273, 5, false),
  (6, NULL, (SELECT id FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1), 5, false),
  (6, NULL, 529, 5, false),
  (6, NULL, 389, 15, false),
  (6, NULL, 213, 15, false),
  (6, NULL, 212, 15, false),
  (6, NULL, 532, 15, false),
  (6, NULL, 528, 15, false),
  (6, NULL, (SELECT id FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3), 25, false),
  (6, NULL, (SELECT id FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3), 25, false),
  (6, NULL, (SELECT id FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3), 25, false),
  (9, NULL, 797, 5, false),
  (9, NULL, (SELECT id FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0), 5, false),
  (9, NULL, (SELECT id FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0), 5, false),
  (9, NULL, 300, 5, false),
  (9, NULL, 15, 5, false),
  (9, NULL, 290, 5, false),
  (9, NULL, 27, 5, false),
  (9, NULL, 273, 5, false),
  (9, NULL, (SELECT id FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1), 5, false),
  (9, NULL, 529, 5, false),
  (9, NULL, 389, 15, false),
  (9, NULL, 213, 15, false),
  (9, NULL, 212, 15, false),
  (9, NULL, 532, 15, false),
  (9, NULL, 528, 15, false),
  (9, NULL, (SELECT id FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3), 25, false),
  (9, NULL, (SELECT id FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3), 25, false),
  (9, NULL, (SELECT id FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3), 25, false),
  (10, NULL, 797, 5, false),
  (10, NULL, (SELECT id FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0), 5, false),
  (10, NULL, (SELECT id FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0), 5, false),
  (10, NULL, 300, 5, false),
  (10, NULL, 15, 5, false),
  (10, NULL, 290, 5, false),
  (10, NULL, 27, 5, false),
  (10, NULL, 273, 5, false),
  (10, NULL, (SELECT id FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1), 5, false),
  (10, NULL, 529, 5, false),
  (10, NULL, 389, 15, false),
  (10, NULL, 213, 15, false),
  (10, NULL, 212, 15, false),
  (10, NULL, 532, 15, false),
  (10, NULL, 528, 15, false),
  (10, NULL, (SELECT id FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3), 25, false),
  (10, NULL, (SELECT id FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3), 25, false),
  (10, NULL, (SELECT id FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3), 25, false),
  (11, NULL, 797, 5, false),
  (11, NULL, (SELECT id FROM spells WHERE name = 'Iron Pulse' AND element_id = 16 AND base_level = 0), 5, false),
  (11, NULL, (SELECT id FROM spells WHERE name = 'Limb Wither' AND element_id = 16 AND base_level = 0), 5, false),
  (11, NULL, 300, 5, false),
  (11, NULL, 15, 5, false),
  (11, NULL, 290, 5, false),
  (11, NULL, 27, 5, false),
  (11, NULL, 273, 5, false),
  (11, NULL, (SELECT id FROM spells WHERE name = 'Hobbling Strike' AND element_id = 16 AND base_level = 1), 5, false),
  (11, NULL, 529, 5, false),
  (11, NULL, 389, 15, false),
  (11, NULL, 213, 15, false),
  (11, NULL, 212, 15, false),
  (11, NULL, 532, 15, false),
  (11, NULL, 528, 15, false),
  (11, NULL, (SELECT id FROM spells WHERE name = 'Ironbrawn' AND element_id = 16 AND base_level = 3), 25, false),
  (11, NULL, (SELECT id FROM spells WHERE name = 'War Trance' AND element_id = 16 AND base_level = 3), 25, false),
  (11, NULL, (SELECT id FROM spells WHERE name = 'Unstrung' AND element_id = 16 AND base_level = 3), 25, false);

COMMIT;
