-- Soul Smith (class 16) + Mark of Crossroads / Legion / Possession (50-52), Possession third-caster spellcasting,
-- 3 homebrew spells. Source: class-kit/rules/16-soul-smith*.md (LOCKED by Gabriel 2026-10-16). Safe to re-run.
BEGIN;

-- 1. Schema: subclass-level casting + subclass-keyed slot tables
ALTER TABLE sub_classes ADD COLUMN IF NOT EXISTS spellcasting TEXT;
ALTER TABLE sub_classes ADD COLUMN IF NOT EXISTS spellcasting_stat TEXT;
ALTER TABLE sub_classes ADD COLUMN IF NOT EXISTS caster_type TEXT;
ALTER TABLE class_spell_slots ADD COLUMN IF NOT EXISTS subclass_id INTEGER REFERENCES sub_classes(id) ON DELETE CASCADE;
ALTER TABLE class_spell_slots DROP CONSTRAINT IF EXISTS class_spell_slots_class_id_level_slot_level_key;
CREATE UNIQUE INDEX IF NOT EXISTS class_spell_slots_class_sub_level_slot_key
  ON class_spell_slots (class_id, COALESCE(subclass_id, 0), level, slot_level);

-- 2. Homebrew spells (Eldridia text)
INSERT INTO spells (id, name, base_level, casting_time, range, duration, state_id, element_id, alignment_id, base_damage_dice, opponent_save_roll, action_type, base_description)
SELECT v.* FROM (VALUES
 (435, 'Make Friends', 0, 1, 10, 1.0, 4, 9, 5, NULL, NULL, 'action',
  'Enchantment cantrip; 1 action; Self, affecting one creature within 10 ft; S, M (a little makeup); concentration, up to 1 minute. You have advantage on CHA checks against one non-hostile creature for the duration. When the spell ends, the creature knows it was charmed and becomes hostile to you.'),
 (436, 'Darkling Whispers', 1, 1, 60, 0.0, 9, 9, 2, '3d6', 'WIS', 'action',
  'Enchantment, 1st level; 1 action; 60 ft; V; instantaneous. A whisper only the target hears tears at its mind. WIS save: on a failure it takes 3d6 psychic damage and must use its reaction, if it has one, to move as far from you as its speed allows, by the safest route. On a success, half damage and no forced move. Deafened creatures automatically succeed. +1d6 per slot above 1st.'),
 (434, 'Crown of Lies', 2, 1, 120, 1.0, 4, 9, 5, NULL, 'WIS', 'action',
  'Enchantment, 2nd level; 1 action; 120 ft; V, S; concentration, up to 1 minute. One humanoid you can see makes a WIS save or is charmed. Before it moves on each of its turns, it must make one melee attack against a creature other than you that you choose mentally, or it acts normally if no such creature is in reach. It repeats the save at the end of each of its turns. On each of your turns, you must use your action to keep control, or the spell ends.')
) v(id, name, base_level, casting_time, range, duration, state_id, element_id, alignment_id, dice, save, action_type, descr)
ON CONFLICT (id) DO NOTHING;
SELECT setval('spells_id_seq', (SELECT max(id) FROM spells));

-- 3. Class
INSERT INTO classes (id, name, primary_stat, hitpoint_die, description, saving_throws, armor_proficiencies, weapon_proficiencies,
  tool_proficiencies, skill_choice_count, skill_options, skill_fixed, class_dc, spellcasting, spellcasting_stat, caster_type,
  subclass_level, subclass_feature_levels, titles, img_url)
VALUES (16, 'Soul Smith', 'CHA', 10,
  'The Soul Smith relies on Charisma (class DC, Temper) with Constitution secondary (Quench, Anvil Heart, pool from L17). A CHA/CON martial bruiser: force-damage weapon strikes fed by a renewable Temper pool, a push-your-luck Strain track, and a Crossing track that summons the class''s devil ally. Spellcasting: none (Mark of Possession casts). At level 3 you choose one of 3 Marks: Crossroads, Legion, Possession. Titles: L20 Soulwright; L30 Twin-Souled.',
  ARRAY['CON','CHA'], 'Light Armor, Medium Armor, Shields', 'Simple Weapons, Martial Weapons, Soul Brand (any size; Oversized weapons rules)', 'Smith''s Tools',
  2, ARRAY['Athletics','Deception','Insight','Intimidation','Persuasion','Religion'], '{}',
  '8 + PB + CHA modifier (Hammerfall, Soulquake, all subclass saves)', 'None. Mark of Possession casts (see subclass).', NULL, 'none',
  3, ARRAY[3,6,10,14,18,24,28], 'L20 Soulwright; L30 Twin-Souled', '/classes/soul-smith.png')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, primary_stat=EXCLUDED.primary_stat, hitpoint_die=EXCLUDED.hitpoint_die,
  description=EXCLUDED.description, saving_throws=EXCLUDED.saving_throws, armor_proficiencies=EXCLUDED.armor_proficiencies,
  weapon_proficiencies=EXCLUDED.weapon_proficiencies, tool_proficiencies=EXCLUDED.tool_proficiencies,
  skill_choice_count=EXCLUDED.skill_choice_count, skill_options=EXCLUDED.skill_options, skill_fixed=EXCLUDED.skill_fixed,
  class_dc=EXCLUDED.class_dc, spellcasting=EXCLUDED.spellcasting, spellcasting_stat=EXCLUDED.spellcasting_stat,
  caster_type=EXCLUDED.caster_type, subclass_level=EXCLUDED.subclass_level,
  subclass_feature_levels=EXCLUDED.subclass_feature_levels, titles=EXCLUDED.titles, img_url=EXCLUDED.img_url;
SELECT setval(pg_get_serial_sequence('classes','id'), GREATEST((SELECT max(id) FROM classes), 1)) WHERE pg_get_serial_sequence('classes','id') IS NOT NULL;

-- 4. Marks
INSERT INTO sub_classes (id, name, class_id, img_url, description, armor_proficiencies, weapon_proficiencies, tool_proficiencies, spellcasting, spellcasting_stat, caster_type) VALUES
 (50, 'Mark of Crossroads', 16, '/subclasses/sub-soul-smith-crossroads.png', 'Debuffs and trades. Your devil keeps a ledger: creatures that hurt you become Indebted, and you collect with interest.', '', '', '', NULL, NULL, NULL),
 (51, 'Mark of Legion', 16, '/subclasses/sub-soul-smith-legion.png', 'Frontline tank. Your devil is a soldier of the infernal ranks; you hold the line and drill your allies to fight as one.', 'Heavy Armor', '', '', NULL, NULL, NULL),
 (52, 'Mark of Possession', 16, '/subclasses/sub-soul-smith-possession.png', 'Possession, misdirection, control. Your devil whispers charms and terrors through you. Third caster (CHA) from level 3.', '', '', '',
  'Third caster from Soul Smith level 3, using CHA. Possession spell list; soul brand is the focus. Slots top out at 4th tier.', 'CHA', 'third')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, class_id=EXCLUDED.class_id, img_url=EXCLUDED.img_url, description=EXCLUDED.description,
  armor_proficiencies=EXCLUDED.armor_proficiencies, spellcasting=EXCLUDED.spellcasting, spellcasting_stat=EXCLUDED.spellcasting_stat, caster_type=EXCLUDED.caster_type;
SELECT setval('sub_classes_id_seq', GREATEST((SELECT max(id) FROM sub_classes), (SELECT last_value FROM sub_classes_id_seq)));

-- 5. Item proficiencies
INSERT INTO class_item_proficiencies (class_id, subclass_id, item_kind, match_field, match_value, min_level)
SELECT 16, NULL::int, k, f, v, 1 FROM (VALUES ('armor','armor_type','light'),('armor','armor_type','medium'),('armor','armor_type','shield'),
  ('weapon','weapon_type','simple'),('weapon','weapon_type','martial')) x(k,f,v)
UNION ALL SELECT 16, 51, 'armor', 'armor_type', 'heavy', 3
ON CONFLICT DO NOTHING;

-- 6. Level table
INSERT INTO class_levels (class_id, level, description, proficiency_bonus, resources)
SELECT 16, l, d, CASE WHEN l<=4 THEN 2 WHEN l<=8 THEN 3 WHEN l<=12 THEN 4 WHEN l<=16 THEN 5 WHEN l<=20 THEN 6 WHEN l<=24 THEN 7 ELSE 8 END,
  'Attacks ' || CASE WHEN l>=20 THEN 4 WHEN l>=5 THEN 2 ELSE 1 END || '; Soul Strike ' || CASE WHEN l>=23 THEN '3d8' WHEN l>=11 THEN '2d8' ELSE '1d8' END
  || '; Temper = ceil(level/2) + CHA' || CASE WHEN l>=17 THEN ' + CON' ELSE '' END || '; Strain 0-5; Crossing 0-3'
FROM (VALUES
 (1,'Soul Temper + Soul Strike + Bondsense'),(2,'Quench + Call the Brand'),(3,'Subclass (Mark) + Tempered Hide'),(4,'Ability Boost'),
 (5,'Extra Attack (2) + Anvil Heart'),(6,'Subclass feature'),(7,'Hammerfall + Kept Soul'),(8,'Ability Boost'),(9,'Open the Door'),
 (10,'Subclass feature'),(11,'Soul Strike 2d8 + Branded'),(12,'Ability Boost'),(13,'Steady Forge'),(14,'Subclass feature'),
 (15,'Soulquake'),(16,'Ability Boost'),(17,'Long Crossing (2 min, pool + CON)'),(18,'Subclass feature'),(19,'Ability Boost'),
 (20,'Soulwright (title) + Extra Attack (4)'),(21,'Bottomless Forge'),(22,'Ability Boost'),(23,'Soul Strike 3d8'),(24,'Subclass mythic feature'),
 (25,'Unclaimable'),(26,'Ability Boost'),(27,'Hammerfall upgrade'),(28,'Subclass mythic feature'),(29,'Ability Boost'),(30,'Twin-Souled (capstone)')
) v(l,d)
ON CONFLICT (class_id, level) DO UPDATE SET description=EXCLUDED.description, proficiency_bonus=EXCLUDED.proficiency_bonus, resources=EXCLUDED.resources;

-- 7. Class features
INSERT INTO class_features (class_id, level, name, description, feature_type, source, approved_date, sort_order, action_type, uses, dice)
SELECT 16, level, name, description, feature_type, 'new', DATE '2026-10-16', sort_order, action_type, uses, dice FROM (VALUES
 (1,'Soul Temper','Temper pool: ceil(Soul Smith level / 2) + CHA modifier (minimum 1); from level 17 add CON. All back on a long rest, half your max (rounded down) on a short rest. Once per turn, when you drop a creature to 0 HP or take a critical hit, regain 1 Temper. Stability: Strain 0-5. Spending 3+ Temper in one turn or using a (Strain) feature adds 1 Strain (max 2 per turn; a Strain feature costing 3+ adds only 1). Heat: +1 force damage per Strain on soul brand and hammer hits. Fray (3+ Strain): disadvantage on CHA saves and concentration checks (until level 20). Overflow: at 5 Strain, further Strain becomes 1 Crossing. Cooling: short rest removes 2 Strain; long rest removes all Strain and Crossing. Crossing (0-3): at 3 your devil crosses over for 1 minute (2 from 17) as an ally acting on your turn with HP = 5 x your level. When it drops or its time ends while you have 3+ Strain, make a DC 15 CHA save (12 from 13); on a fail it stays 1 more round acting on its own (your Mark''s Crossing effect). Crossing then resets to 0.','resource',1,NULL,NULL,NULL),
 (1,'Lean on the Link','Bonus action: remove 1 Strain and gain 1 Crossing. Can''t be used while your devil has crossed over.','feature',2,'bonus','At will (not while devil is crossed over)',NULL),
 (1,'Crossing Over (devil ally)','At 3 Crossing your devil crosses over (see Soul Temper). Its attack deals 1d10 + proficiency force (2d10 at 11, 3d10 at 23). Legion devil: +2 AC and opportunity attacks use its reaction. Crossroads devil: its attack also applies Indebted. Possession devil: teleports 30 ft as part of its move and is invisible in darkness.','feature',3,NULL,'Passive (triggers at 3 Crossing)','1d10'),
 (1,'Soul Strike','When you hit with a soul brand or a hammer, spend 1 Temper to deal +1d8 force damage (2d8 from 11, 3d8 from 23). Once per hit; any number of hits per turn.','feature',4,NULL,'At will (1 Temper per hit)','1d8'),
 (1,'Bondsense','You sense the presence and direction of fiends, binding agreements, and bound souls within 30 ft.','feature',5,NULL,'Passive',NULL),
 (1,'Soul Brand','Your soul brand: 1d8 bludgeoning or slashing (choose when called), versatile (1d10), thrown 20/60 (returns, from level 2). Martial melee; use CHA instead of STR for attack and damage. Counts as a focus for Soul Smith features. Can''t be disarmed while you''re conscious; if it leaves your hand it vanishes at the end of your turn unless thrown. Oversized weapons: you''re proficient with weapons of any size. Large: +1 damage die, two-handed, heavy, loses light and finesse. Huge+: +2 dice and at most 2 attacks per turn with it. Soul Strike, Strain and subclass dice never grow with size; no oversized soul brand.','feature',6,NULL,'Passive',NULL),
 (2,'Quench','Bonus action, 2 uses per short rest (3 from 13): remove 1 Strain and gain temporary HP = 1d6 + CON modifier (2d6 at 11, 3d6 at 23).','feature',1,'bonus','2 per short rest','1d6'),
 (2,'Call the Brand','As part of an attack, summon your soul brand into an empty hand or dismiss it. It can be thrown (20/60) and returns to your hand.','feature',2,NULL,'At will (part of an attack)',NULL),
 (3,'Soul Smith Subclass','Choose your Mark: Crossroads, Legion, or Possession, and gain its level 3 feature.','choice',1,NULL,NULL,NULL),
 (3,'Tempered Hide','While you have 1+ Strain, add your Strain count (max +2) to AC against melee attacks.','feature',2,NULL,'Passive',NULL),
 (4,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost',1,NULL,NULL,NULL),
 (5,'Extra Attack (2)','You make 2 attacks when you take the Attack action.','feature',1,NULL,NULL,NULL),
 (5,'Anvil Heart','Once per turn, when Soul Strike hits, gain temporary HP equal to your Strain + CON modifier (minimum 1).','feature',2,NULL,'At will (once per turn)',NULL),
 (6,'Subclass feature','Gain your Mark''s level 6 feature.','feature',1,NULL,NULL,NULL),
 (7,'Hammerfall','Reaction, 2 Temper (1 from 27): when a creature within 5 ft of you attacks an ally, it makes a STR save (class DC) or is knocked prone.','feature',1,'reaction','At will (2 Temper; 1 from 27)',NULL),
 (7,'Kept Soul','Advantage on saves against effects that would possess you or steal or trap your soul.','feature',2,NULL,'Passive',NULL),
 (8,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost',1,NULL,NULL,NULL),
 (9,'Open the Door (Strain)','Bonus action, 0 Temper; gain 1 Crossing and 1 Strain: your devil''s hand or shadow reaches through; make one extra Soul Strike attack with reach 10 ft.','feature',1,'bonus','At will (gain 1 Crossing + 1 Strain)',NULL),
 (10,'Subclass feature','Gain your Mark''s level 10 feature.','feature',1,NULL,NULL,NULL),
 (11,'Soul Strike 2d8','Soul Strike deals +2d8 force. Quench temporary HP becomes 2d6 + CON.','resource',1,NULL,NULL,'2d8'),
 (11,'Branded','A creature hit by Soul Strike can''t turn invisible or teleport until the start of your next turn.','feature',2,NULL,'Passive',NULL),
 (12,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost',1,NULL,NULL,NULL),
 (13,'Steady Forge','Crossing control DC becomes 12. Quench becomes 3 uses per short rest.','feature',1,NULL,'Passive',NULL),
 (14,'Subclass feature','Gain your Mark''s level 14 feature.','feature',1,NULL,NULL,NULL),
 (15,'Soulquake (Strain)','Action, 4 Temper, gain 1 Strain (total): 20-ft radius centered on you. STR save (class DC): 6d8 force and prone; half and not prone on a success. Fiends take maximum damage. 8d8 from 25.','feature',1,'action','At will (4 Temper)','6d8'),
 (16,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost',1,NULL,NULL,NULL),
 (17,'Long Crossing','Your crossed-over devil stays 2 minutes. Add your CON modifier to your Temper maximum.','resource',1,NULL,'Passive',NULL),
 (18,'Subclass feature','Gain your Mark''s level 18 feature.','feature',1,NULL,NULL,NULL),
 (19,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 22.','boost',1,NULL,NULL,NULL),
 (20,'Soulwright','You earn the level 20 title Soulwright: CHA and CON +2 (cap 24); resistance to force and necrotic damage; Strain no longer gives disadvantage.','title',1,NULL,NULL,NULL),
 (20,'Soulwright: Summon at Will','Bonus action, 1 per long rest: call your devil across at any Crossing level. It arrives obedient: no control save when it leaves this time.','feature',2,'bonus','1 per long rest',NULL),
 (20,'Extra Attack (4)','You make 4 attacks when you take the Attack action (martial parity).','feature',3,NULL,NULL,NULL),
 (21,'Bottomless Forge','Regain 4 extra Temper on a short rest. The first Strain you gain each combat is free.','resource',1,NULL,'Passive',NULL),
 (22,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 24.','boost',1,NULL,NULL,NULL),
 (23,'Soul Strike 3d8','Soul Strike deals +3d8 force. Quench temporary HP becomes 3d6 + CON.','resource',1,NULL,'Passive','3d8'),
 (24,'Subclass feature','Gain your Mark''s level 24 (mythic) feature.','feature',1,NULL,NULL,NULL),
 (25,'Unclaimable','Immune to charmed and frightened. Your soul can''t be stolen, swapped, trapped, or claimed by anyone, including your devil. Soulquake deals 8d8.','feature',1,NULL,'Passive',NULL),
 (26,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 24.','boost',1,NULL,NULL,NULL),
 (27,'Hammerfall Upgrade','Hammerfall costs 1 Temper and can trigger twice per round.','feature',1,NULL,'Passive',NULL),
 (28,'Subclass feature','Gain your Mark''s level 28 (mythic) feature.','feature',1,NULL,NULL,NULL),
 (29,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 26.','boost',1,NULL,NULL,NULL),
 (30,'Twin-Souled','Bonus action, 1 per long rest, 1 minute: you''re at 5 Strain with no drawbacks (can''t gain Strain or Crossing); Soul Strike costs 0 Temper; your hit damage is force and treats resistance as normal damage; you gain your Mark''s mythic aura (Crossroads: Indebted on up to 5 targets). Once, you can drop to 1 HP instead of 0. When it ends, gain 1 level of exhaustion; Strain and Crossing reset to 0.','feature',1,'bonus','1 per long rest',NULL)
) v(level,name,description,feature_type,sort_order,action_type,uses,dice)
ON CONFLICT (class_id, level, name) DO UPDATE SET description=EXCLUDED.description, feature_type=EXCLUDED.feature_type,
  approved_date=EXCLUDED.approved_date, sort_order=EXCLUDED.sort_order, action_type=EXCLUDED.action_type, uses=EXCLUDED.uses, dice=EXCLUDED.dice;

-- 8. Mark features
INSERT INTO subclass_features (subclass_id, level, name, description, feature_type, source, approved_date, sort_order, action_type, uses, dice)
SELECT sid, level, name, description, 'feature', 'new', DATE '2026-10-16', 1, action_type, uses, dice FROM (VALUES
 (51,3,'Legion Oath','Heavy armor proficiency. When Soul Strike hits, you can push the target 5 ft.',NULL,'Passive',NULL),
 (51,6,'Shield-Brother','While your devil has crossed over, allies adjacent to it gain +2 AC.',NULL,'Passive',NULL),
 (51,10,'Drilled Ranks (Strain)','Bonus action, once per turn, gain 1 Strain: allies within 15 ft can each use their reaction to make one weapon attack.','bonus','At will (once per turn; 1 Strain)',NULL),
 (51,14,'March of Iron','At 3+ Strain, you can''t be pushed or knocked prone.',NULL,'Passive',NULL),
 (51,18,'Hold the Line','Bonus action, 1 per long rest, 1 minute: an enemy must succeed on a STR save (class DC) to move away from you.','bonus','1 per long rest',NULL),
 (51,24,'Mythic Standard','30-ft aura: allies add 1d4 to attack rolls.',NULL,'Passive','1d4'),
 (51,28,'Legion Unbound','Crossing effect: on a failed control save, the devil guards you and attacks your enemies instead of acting freely.',NULL,'Passive (on failed control save)',NULL),
 (50,3,'Writ of the Ledger','Bonus action: mark a creature as Indebted. When it damages you, your next Soul Strike hit on it deals extra damage equal to what it dealt (max 2 x your level).','bonus','At will',NULL),
 (50,6,'Fine Print','Reaction: when an Indebted creature makes a save, it subtracts 1d6.','reaction','At will','1d6'),
 (50,10,'Fair Exchange (Strain)','Action, gain 1 Strain: end one condition on you and impose it on a creature within 30 ft.','action','At will (1 Strain)',NULL),
 (50,14,'Collected Interest','Regain 1 Temper whenever an Indebted creature fails a save.',NULL,'Passive',NULL),
 (50,18,'Debt Called','Action, 1 per long rest: an Indebted creature makes a CHA save (class DC) or loses its next turn.','action','1 per long rest',NULL),
 (50,24,'Mythic Clause','Indebted can be on up to 3 creatures at once.',NULL,'Passive',NULL),
 (50,28,'Ledger Unbound','Crossing effect: on a failed control save, the devil collects from your enemies instead of you; every Indebted creature takes 6d8 force.',NULL,'Passive (on failed control save)','6d8'),
 (52,3,'Bond of Whispers','Proficiency in Deception and Insight. You can speak mind-to-mind with your devil up to 1 mile.',NULL,'Passive',NULL),
 (52,3,'Possession Spellcasting','Third caster from level 3, using CHA (spell DC = class DC; spell attack = proficiency + CHA). Cantrips: 2 at L3, 3 at L10. Spells known: 3 at L3 up to 18 at L30. Possession list only, up to 4th tier; soul brand is your focus; slots return on a long rest. Casting never costs or restores Temper and never adds or removes Strain or Crossing (Fray still applies to concentration).','action','Slots (long rest)',NULL),
 (52,6,'Shadow Step','Bonus action, 1 Temper: teleport up to 30 ft to an unoccupied space in dim light or darkness.','bonus','At will (1 Temper)',NULL),
 (52,10,'Murmur (Strain)','Action, gain 1 Strain: a creature within 60 ft makes a WIS save (class DC) or is charmed by you for 1 minute; ends if it takes damage.','action','At will (1 Strain)',NULL),
 (52,14,'Veiled Self','Invisible while you''re in darkness and haven''t moved.',NULL,'Passive',NULL),
 (52,18,'Turned Will','Action, 1 per long rest: a creature charmed by you fights for you for 1 minute.','action','1 per long rest',NULL),
 (52,24,'Mythic Hush','Enemies within 20 ft of you can''t speak or use verbal components.',NULL,'Passive',NULL),
 (52,28,'Whisper Unbound','Crossing effect: on a failed control save, the devil turns on your enemies instead of you; each enemy within 30 ft makes a WIS save (class DC) or is frightened.',NULL,'Passive (on failed control save)',NULL)
) v(sid,level,name,description,action_type,uses,dice)
ON CONFLICT (subclass_id, level, name) DO UPDATE SET description=EXCLUDED.description, approved_date=EXCLUDED.approved_date,
  action_type=EXCLUDED.action_type, uses=EXCLUDED.uses, dice=EXCLUDED.dice;

INSERT INTO subclass_levels (subclass_id, level, description)
SELECT subclass_id, level, string_agg(name, ' + ' ORDER BY id) FROM subclass_features WHERE subclass_id IN (50,51,52) GROUP BY subclass_id, level
ON CONFLICT (subclass_id, level) DO UPDATE SET description=EXCLUDED.description;

-- 9. Possession slots (L3-30, s1-s4)
INSERT INTO class_spell_slots (class_id, subclass_id, level, slot_level, slots)
SELECT 16, 52, l, sl, n FROM (
  SELECT l, 1 AS sl, CASE WHEN l>=7 THEN 4 WHEN l>=4 THEN 3 ELSE 2 END AS n FROM generate_series(3,30) l
  UNION ALL SELECT l, 2, CASE WHEN l>=10 THEN 3 ELSE 2 END FROM generate_series(7,30) l
  UNION ALL SELECT l, 3, CASE WHEN l>=16 THEN 3 ELSE 2 END FROM generate_series(13,30) l
  UNION ALL SELECT l, 4, CASE WHEN l>=25 THEN 3 WHEN l>=21 THEN 2 ELSE 1 END FROM generate_series(19,30) l
) x
ON CONFLICT (class_id, COALESCE(subclass_id, 0), level, slot_level) DO UPDATE SET slots = EXCLUDED.slots;

-- 10. Possession spell list
INSERT INTO class_spells (class_id, subclass_id, spell_id, min_level)
SELECT 16, 52, s.id, v.lvl FROM (VALUES
 (435 /* Make Friends */,3),(7 /* Hallucinate */,3),(417 /* Barbed Jest */,3),
 (155 /* Warm Regard */,3),(162 /* Commanding Word */,3),(436 /* Darkling Whispers */,3),(274 /* Giggle Curse */,3),(382 /* Slumber Mist */,3),
 (276 /* Body Lock */,7),(396 /* Honeyed Urging */,7),(434 /* Crown of Lies */,7),(288 /* Vanish */,7),
 (223 /* Terror Wave */,13),(279 /* Mesmer Weave */,13),(309 /* Grand Illusion */,13),
 (168 /* Bewilder */,19),(205 /* Beastbind */,19),(330 /* Nightmare Shade */,19)
) v(id,lvl) JOIN spells s ON s.id = v.id
ON CONFLICT (class_id, COALESCE(subclass_id, 0), spell_id) DO UPDATE SET min_level = EXCLUDED.min_level;

COMMIT;
SELECT (SELECT count(*) FROM class_features WHERE class_id=16) AS class_feats,
       (SELECT count(*) FROM subclass_features WHERE subclass_id IN (50,51,52)) AS mark_feats,
       (SELECT count(*) FROM class_spell_slots WHERE class_id=16 AND subclass_id=52) AS slot_rows,
       (SELECT count(*) FROM class_spells WHERE class_id=16 AND subclass_id=52) AS spells;
