-- Gracewraith (class 15) + Archonbound / Seraphbound / Virtuebound subclasses + Gracewraith weapons.
-- Source: class-kit/rules/15-gracewraith.md (LOCKED by Gabriel 2026-10-15). Safe to re-run.
-- Art is not wired yet (Artemis is redoing it): class img_url stays 'Pending Img', subclass img_url NULL.
BEGIN;

INSERT INTO classes (id, name, primary_stat, hitpoint_die, description, saving_throws, armor_proficiencies, weapon_proficiencies,
  tool_proficiencies, skill_choice_count, skill_options, skill_fixed, class_dc, spellcasting, spellcasting_stat, caster_type,
  subclass_level, subclass_feature_levels, titles)
VALUES (15, 'Gracewraith', 'INT', 10,
  'The Gracewraith relies on Intelligence (class DC, Radiance) with Constitution secondary (Breach saves, Reseal, Grace Leech). A martial binder: chain-reach control and radiant weapon damage fed by a stolen Radiance pool, with a self-damaging Seal Crack track. Spellcasting: None. At level 3 you choose one of 3 subclasses: Archon, Seraph, Virtue. Titles: L20 Sacred Chains; L30 Divine Chains.',
  ARRAY['CON','INT'], 'Light Armor, Medium Armor', 'Simple Weapons, Flails, War Flails, Spiked Chains, Chain Whips, Sigil Blades', '',
  2, ARRAY['Arcana','Athletics','Insight','Intimidation','Investigation','Religion'], '{}',
  '8 + PB + INT modifier (Shackle, Radiant Lash, all subclass saves)', 'None', '', '',
  3, ARRAY[3,6,10,14,18,24,28], 'L20 Sacred Chains; L30 Divine Chains')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, primary_stat=EXCLUDED.primary_stat, hitpoint_die=EXCLUDED.hitpoint_die,
  description=EXCLUDED.description, saving_throws=EXCLUDED.saving_throws, armor_proficiencies=EXCLUDED.armor_proficiencies,
  weapon_proficiencies=EXCLUDED.weapon_proficiencies, tool_proficiencies=EXCLUDED.tool_proficiencies,
  skill_choice_count=EXCLUDED.skill_choice_count, skill_options=EXCLUDED.skill_options, skill_fixed=EXCLUDED.skill_fixed,
  class_dc=EXCLUDED.class_dc, spellcasting=EXCLUDED.spellcasting, spellcasting_stat=EXCLUDED.spellcasting_stat,
  caster_type=EXCLUDED.caster_type, subclass_level=EXCLUDED.subclass_level,
  subclass_feature_levels=EXCLUDED.subclass_feature_levels, titles=EXCLUDED.titles;

-- Weapons (sigil blade + the two chains the 5e table lacks). Same +1..+4 ladder as other weapons.
INSERT INTO weapons (name, weapon_type, category, damage_dice, damage_type, properties, weight_lb, description, rarity, attack_bonus)
SELECT b.name || CASE WHEN t.n=0 THEN '' ELSE ' +' || t.n END, 'martial', 'melee', b.dice, b.dtype, b.props, b.wt,
  b.descr || CASE WHEN t.n=0 THEN '' ELSE ' Magical +' || t.n || ' to attack and damage.' END, t.rarity, t.n
FROM (VALUES
  ('Sigil Blade', '1d8', 'slash', ARRAY['finesse'], 3.0, 'Rune-etched Gracewraith blade. One-handed, not light. A wielder can use INT instead of STR or DEX for attack and damage rolls; counts as a focus for Gracewraith features.'),
  ('Spiked Chain', '2d4', 'pierce', ARRAY['two-handed','heavy'], 10.0, 'Barbed length of chain. Reach only through Chain Reach.'),
  ('Chain Whip', '1d6', 'slash', ARRAY['finesse'], 3.0, 'Bladed links on a grip. Reach only through Chain Reach.')
) AS b(name, dice, dtype, props, wt, descr)
CROSS JOIN (VALUES (0,'common'),(1,'uncommon'),(2,'rare'),(3,'legendary'),(4,'mythical')) AS t(n, rarity)
ON CONFLICT (name) DO UPDATE SET weapon_type=EXCLUDED.weapon_type, category=EXCLUDED.category, damage_dice=EXCLUDED.damage_dice,
  damage_type=EXCLUDED.damage_type, properties=EXCLUDED.properties, weight_lb=EXCLUDED.weight_lb, description=EXCLUDED.description,
  rarity=EXCLUDED.rarity, attack_bonus=EXCLUDED.attack_bonus;

-- Subclasses (fixed ids so re-runs update in place)
INSERT INTO sub_classes (id, name, class_id, img_url, description, armor_proficiencies, weapon_proficiencies, tool_proficiencies) VALUES
 (47, 'Archonbound', 15, NULL, 'You bound an Archon, a warden of celestial law. Its chains answer your verdicts, pinning the guilty in place until sentence is passed.', '', '', ''),
 (48, 'Seraphbound', 15, NULL, 'You bound a Seraph, a six-winged burning choir. Its fire pours out of every crack in your seal and lifts you into the sky.', '', '', ''),
 (49, 'Virtuebound', 15, NULL, 'You bound a Virtue, a celestial of mercy. You spend its stolen grace to mend allies, turn aside doom, and drag the newly dead back to life.', '', '', '')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, class_id=EXCLUDED.class_id, description=EXCLUDED.description;
SELECT setval('sub_classes_id_seq', GREATEST((SELECT max(id) FROM sub_classes), (SELECT last_value FROM sub_classes_id_seq)));

-- Item proficiencies (used by equip checks)
INSERT INTO class_item_proficiencies (class_id, subclass_id, item_kind, match_field, match_value, min_level)
SELECT 15, NULL::int, k, f, v, 1 FROM (VALUES ('armor','armor_type','light'),('armor','armor_type','medium'),('weapon','weapon_type','simple')) x(k,f,v)
UNION ALL
SELECT 15, NULL::int, 'weapon', 'name', w.name, 1 FROM weapons w
 WHERE w.name ~ '^(Flail|War Flail|Spiked Chain|Chain Whip|Sigil Blade)( \+[1-4])?$'
ON CONFLICT DO NOTHING;

-- Level table
INSERT INTO class_levels (class_id, level, description, proficiency_bonus, resources)
SELECT 15, l, d, CASE WHEN l<=4 THEN 2 WHEN l<=8 THEN 3 WHEN l<=12 THEN 4 WHEN l<=16 THEN 5 WHEN l<=20 THEN 6 WHEN l<=24 THEN 7 ELSE 8 END,
  'Attacks ' || CASE WHEN l>=20 THEN 4 WHEN l>=5 THEN 2 ELSE 1 END || '; Sigil Strike ' || CASE WHEN l>=23 THEN '3d8' WHEN l>=11 THEN '2d8' ELSE '1d8' END
  || '; Radiance = ceil(level/2) + INT' || CASE WHEN l>=17 THEN ' + CON' ELSE '' END || '; Seal Cracks 0-5'
FROM (VALUES
 (1,'Stolen Radiance (Radiance pool + Seal Cracks) + Sigil Strike + Binding Sight'),
 (2,'Reseal + Chain Reach'),
 (3,'Subclass + Halo Ward'),
 (4,'Ability Boost'),
 (5,'Extra Attack (2) + Grace Leech'),
 (6,'Subclass feature'),
 (7,'Shackle + Taboo Mind'),
 (8,'Ability Boost'),
 (9,'Wrested Wings'),
 (10,'Subclass feature'),
 (11,'Sigil Strike 2d8 + Brighter Wound'),
 (12,'Ability Boost'),
 (13,'Seal Mastery (Breach DC 12, Reseal 3/short rest)'),
 (14,'Subclass feature'),
 (15,'Radiant Lash'),
 (16,'Ability Boost'),
 (17,'Wrested Wings lasts 1 minute + Radiance pool adds CON'),
 (18,'Subclass feature'),
 (19,'Ability Boost'),
 (20,'Sacred Chains (title) + Extra Attack (4)'),
 (21,'Unbroken Vessel'),
 (22,'Ability Boost'),
 (23,'Sigil Strike 3d8'),
 (24,'Subclass mythic feature'),
 (25,'Grace Eternal'),
 (26,'Ability Boost'),
 (27,'Shackle upgrade'),
 (28,'Subclass mythic feature'),
 (29,'Ability Boost'),
 (30,'Divine Chains (capstone)')
) v(l,d)
ON CONFLICT (class_id, level) DO UPDATE SET description=EXCLUDED.description, proficiency_bonus=EXCLUDED.proficiency_bonus, resources=EXCLUDED.resources;

-- Class features
INSERT INTO class_features (class_id, level, name, description, feature_type, source, approved_date, sort_order, action_type, uses, dice)
SELECT 15, level, name, description, feature_type, source, DATE '2026-10-15', sort_order, action_type, uses, dice FROM (VALUES
 (1,'Stolen Radiance','You have a Radiance pool of ceil(Gracewraith level / 2) + INT modifier (minimum 1); from level 17 add your CON modifier. Regain all on a long rest and half your maximum (rounded down) on a short rest. You also track Seal Cracks (0 to 5): each Crack adds +1 radiant damage to sigil blade, chain, and flail hits. At 3+ Cracks you shed bright light 10 ft (dim 10 ft more), can''t Hide, and take radiant damage equal to your Cracks at the start of each turn (ignores resistance). Spending 3+ Radiance in one turn adds 1 Crack (a Crack feature costing 3+ adds only 1 total); max 2 Cracks per turn except Stolen Resurrection. Breach: if you would gain a 6th Crack, make a DC 15 CON save (Cracks stay at 5). Fail: stunned until the end of your next turn and your bound entity''s Breach effect happens (Archon: a creature of the GM''s choice within 30 ft is restrained until the end of its next turn, save ends; Seraph: 10-ft burst, 3d8 radiant to all but you, DEX save half; Virtue: you lose all remaining Radiance). Mending: a short rest removes 2 Cracks, a long rest removes all, and Cracks drop by 1 after 10 minutes without gaining any.','resource','approved',1,NULL,NULL,NULL),
 (1,'Sigil Strike','When you hit with a sigil blade, chain, or flail, spend 1 Radiance to deal +1d8 radiant damage (2d8 from 11, 3d8 from 23). Once per hit; any number of hits per turn.','feature','new',2,NULL,'1 Radiance','1d8'),
 (1,'Binding Sight','You sense the presence and direction of celestials, fiends, and holy wards within 30 ft. Not blocked by cover; blocked by 1 ft of stone or a thin sheet of lead.','feature','new',3,NULL,NULL,NULL),
 (1,'Sigil Blade','You can use INT instead of STR or DEX for attack and damage rolls with a sigil blade (1d8 slashing, finesse, one-handed, not light). It counts as a focus for Gracewraith features, but not for another class''s spells.','feature','approved',4,NULL,NULL,NULL),
 (2,'Reseal','Bonus action, 2 uses per short rest (3 from 13): remove 1 Crack and gain temporary HP = 1d6 + CON modifier (2d6 + CON from 11, 3d6 + CON from 23).','feature','new',1,'bonus','2 per rest','1d6'),
 (2,'Chain Reach','Your chains and flails have reach 10 ft. On a hit, you can spend 1 Radiance to pull the target (Large or smaller, no save) up to 10 ft toward you.','feature','new',2,NULL,'1 Radiance',NULL),
 (3,'Gracewraith Subclass','Choose your bound entity: Archonbound, Seraphbound, or Virtuebound, and gain its level 3 feature.','choice','canon',1,NULL,NULL,NULL),
 (3,'Halo Ward','While you have 1+ Crack, add your Crack count (max +2) to AC against ranged attacks.','feature','new',2,NULL,NULL,NULL),
 (4,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost','canon',1,NULL,NULL,NULL),
 (5,'Extra Attack (2)','You make 2 attacks when you take the Attack action.','feature','canon',1,NULL,NULL,NULL),
 (5,'Grace Leech','Once per turn, when Sigil Strike deals damage, regain HP equal to your Crack count + CON modifier (minimum 1).','feature','new',2,NULL,NULL,NULL),
 (6,'Subclass feature','Gain your subclass''s level 6 feature.','feature','canon',1,NULL,NULL,NULL),
 (7,'Shackle','Reaction, 2 Radiance (1 from 27): when a creature within your chain reach moves, it makes a STR save (class DC) or is restrained until the end of its next turn.','feature','new',1,'reaction','2 Radiance',NULL),
 (7,'Taboo Mind','Advantage on saves against being charmed and against effects from celestials.','feature','new',2,NULL,NULL,NULL),
 (8,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost','canon',1,NULL,NULL,NULL),
 (9,'Wrested Wings','Bonus action, 0 Radiance, gain 1 Crack: fly speed equal to your walking speed until the end of your turn (1 minute from 17). You fall if you end your turn in the air when it ends.','feature','new',1,'bonus','At will (1 Crack)',NULL),
 (10,'Subclass feature','Gain your subclass''s level 10 feature.','feature','canon',1,NULL,NULL,NULL),
 (11,'Sigil Strike 2d8','Sigil Strike deals +2d8 radiant. Reseal temporary HP becomes 2d6 + CON.','resource','new',1,NULL,NULL,'2d8'),
 (11,'Brighter Wound','A creature that takes Sigil Strike damage can''t regain HP until the start of your next turn.','feature','new',2,NULL,NULL,NULL),
 (12,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost','canon',1,NULL,NULL,NULL),
 (13,'Seal Mastery','Your Breach save DC becomes 12. Reseal becomes 3 uses per short rest.','feature','approved',1,NULL,NULL,NULL),
 (14,'Subclass feature','Gain your subclass''s level 14 feature.','feature','canon',1,NULL,NULL,NULL),
 (15,'Radiant Lash','Action, 4 Radiance, gain 1 Crack (total): 30-ft line, 5 ft wide. DEX save (class DC): 6d8 radiant (8d8 from 25), half on success. Celestials take maximum damage.','feature','new',1,'action','4 Radiance','6d8'),
 (16,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 20.','boost','canon',1,NULL,NULL,NULL),
 (17,'Wings and Pool','Wrested Wings lasts 1 minute. Add your CON modifier to your Radiance maximum.','resource','new',1,NULL,NULL,NULL),
 (18,'Subclass feature','Gain your subclass''s level 18 feature.','feature','canon',1,NULL,NULL,NULL),
 (19,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 22.','boost','canon',1,NULL,NULL,NULL),
 (20,'Sacred Chains','You earn the level 20 title Sacred Chains: INT and CON +2 (cap 24); resistance to radiant and necrotic damage; Cracks no longer deal leak damage (light and no-Hide still apply).','title','canon',1,NULL,NULL,NULL),
 (20,'Bind the Surge','1 use per long rest: after you make a Breach save (pass or fail), bind the surge instead: no stun, no Breach effect, Cracks reset to 2. Up to INT modifier creatures within 30 ft make a STR save (class DC) or are restrained by spectral chains (save ends).','feature','new',2,NULL,'1 per long rest',NULL),
 (20,'Extra Attack (4)','You make 4 attacks when you take the Attack action (martial parity).','feature','approved',3,NULL,NULL,NULL),
 (21,'Unbroken Vessel','Regain 4 extra Radiance on a short rest. The first Crack you gain each combat (after rolling initiative) doesn''t make you shed light.','resource','new',1,NULL,NULL,NULL),
 (22,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 24.','boost','canon',1,NULL,NULL,NULL),
 (23,'Sigil Strike 3d8','Sigil Strike deals +3d8 radiant. Reseal temporary HP becomes 3d6 + CON.','resource','new',1,NULL,NULL,'3d8'),
 (24,'Subclass feature','Gain your subclass''s level 24 (mythic) feature.','feature','canon',1,NULL,NULL,NULL),
 (25,'Grace Eternal','Immune to frightened and charmed. Celestial magic can''t sense or scry you unless you allow it. Radiant Lash deals 8d8.','feature','new',1,NULL,NULL,NULL),
 (26,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 24.','boost','canon',1,NULL,NULL,NULL),
 (27,'Shackle Upgrade','Shackle costs 1 Radiance and can target 2 creatures that move within your reach in the same round with one reaction.','feature','new',1,NULL,NULL,NULL),
 (28,'Subclass feature','Gain your subclass''s level 28 (mythic) feature.','feature','canon',1,NULL,NULL,NULL),
 (29,'Ability Boost','Raise your ability scores (amount in the Shared Frame); no score can go above 26.','boost','canon',1,NULL,NULL,NULL),
 (30,'Divine Chains','You earn the level 30 title Divine Chains.','title','canon',1,NULL,NULL,NULL),
 (30,'Divine Chains Capstone','Bonus action, 1 minute, 1 use per long rest: you''re at 5 Cracks with no leak damage and no Breach saves (you can''t gain Cracks); fly speed equal to twice your walking speed and you can hover; Sigil Strike costs 0 Radiance; your weapon and Gracewraith-feature damage is radiant and ignores resistance (immunity to radiant is treated as resistance). Once, you can drop to 1 HP instead of 0 (the class''s one cheat-death). When it ends, gain 1 level of exhaustion and Cracks reset to 0.','feature','new',2,'bonus','1 per long rest',NULL)
) v(level,name,description,feature_type,source,sort_order,action_type,uses,dice)
ON CONFLICT (class_id, level, name) DO UPDATE SET description=EXCLUDED.description, feature_type=EXCLUDED.feature_type,
  source=EXCLUDED.source, approved_date=EXCLUDED.approved_date, sort_order=EXCLUDED.sort_order,
  action_type=EXCLUDED.action_type, uses=EXCLUDED.uses, dice=EXCLUDED.dice;

-- Subclass features
INSERT INTO subclass_features (subclass_id, level, name, description, feature_type, source, approved_date, sort_order, action_type, uses, dice)
SELECT sid, level, name, description, feature_type, 'new', DATE '2026-10-15', 1, action_type, uses, dice FROM (VALUES
 (47,3,'Bound Archon','Bonus action: mark one creature you can see within 30 ft (lasts 1 minute or until you mark another). It takes +1d6 radiant from your hits (once per turn) and has disadvantage on attacks against creatures other than you.','feature','bonus','At will','1d6'),
 (47,6,'Verdict of Chains','When your marked target escapes your restraint or moves out of your reach, make one weapon attack against it as a reaction; if it hits, Sigil Strike costs 0.','feature','reaction',NULL,NULL),
 (47,10,'Iron Edict','Action, 2 Radiance, gain 1 Crack: 20-ft aura on you for 1 minute (no concentration); enemies'' speed is halved in it.','feature','action','2 Radiance',NULL),
 (47,14,'Unyielding Law','Resistance to bludgeoning, piercing, and slashing damage while at 3+ Cracks.','feature',NULL,NULL,NULL),
 (47,18,'Sentence Passed','Action, 1 use per long rest: a marked creature within your reach with 50 HP or fewer (100 from 28) makes a CON save (class DC). Fail: it drops to 0 HP. Success: it takes 6d8 radiant. The use is spent either way; legendary-resistance-style features work as normal.','feature','action','1 per long rest','6d8'),
 (47,24,'Mythic Tribunal','You can have up to 3 marks at once.','feature',NULL,NULL,NULL),
 (47,28,'Archon Unchained','On a failed Breach save, every marked target is stunned until the end of its next turn instead of you (no Archon Breach effect). Sentence Passed works on targets with 100 HP or fewer.','feature',NULL,NULL,NULL),
 (48,3,'Bound Seraph','As an attack, make a 60-ft ranged radiant bolt: 1d8 + INT radiant. It counts as a sigil weapon hit for Sigil Strike and Crack damage.','feature',NULL,'At will','1d8'),
 (48,6,'Six Wings','Wrested Wings gives no Crack, and you can hover. Before you gain Wrested Wings at level 9: when you fall, you descend no faster than 60 ft per round, take no falling damage, and move 2 ft horizontally for every 1 ft you fall.','feature',NULL,NULL,NULL),
 (48,10,'Burning Choir','Action, 2 Radiance, gain 1 Crack: 15-ft burst on you; CON save (class DC): 4d8 radiant and blinded until the end of your next turn; half and not blinded on a success.','feature','action','2 Radiance','4d8'),
 (48,14,'Ember Halo','Enemies that start their turn within 10 ft of you take radiant damage equal to your Cracks.','feature',NULL,NULL,NULL),
 (48,18,'Seraph''s Descent','If you fly 30+ ft in a straight line toward a target and hit it with a melee attack that turn, double the Sigil Strike dice (once per turn).','feature',NULL,NULL,NULL),
 (48,24,'Mythic Sixfold Flame','Radiant Lash can be a 60-ft cone instead of a line.','feature',NULL,NULL,NULL),
 (48,28,'Seraph Unchained','While at 5 Cracks, at the start of each of your turns roll a d6; on 5-6, your next Radiant Lash this turn costs no Radiance.','feature',NULL,NULL,NULL),
 (49,3,'Bound Virtue','Bonus action: spend Radiance to heal one creature within 30 ft 1d8 per point (max points per use = proficiency bonus). Not a spell or prayer.','feature','bonus','1 Radiance per 1d8','1d8'),
 (49,6,'Borrowed Miracle','Reaction, 2 Radiance, gain 1 Crack: an ally within 30 ft who fails a save succeeds instead.','feature','reaction','2 Radiance',NULL),
 (49,10,'Mercy Siphon','When Grace Leech heals you, one ally within 30 ft regains the same amount.','feature',NULL,NULL,NULL),
 (49,14,'Sanctum of Theft','Action, 2 Radiance, gain 1 Crack: 15-ft aura on you for 1 minute; allies in it have resistance to one damage type you pick.','feature','action','2 Radiance',NULL),
 (49,18,'Stolen Resurrection','Action, 1 use per long rest: a creature within your reach that died within the last minute returns to life with 1 HP. You gain 2 Cracks (this can trigger a Breach). Can''t target yourself or be used at 0 HP; a creature can''t be brought back this way more than once per long rest, and it fails on death by old age or a missing vital part.','feature','action','1 per long rest',NULL),
 (49,24,'Mythic Grace Wellspring','Healing from Virtuebound features is maximized.','feature',NULL,NULL,NULL),
 (49,28,'Virtue Unchained','On a failed Breach save, instead of being stunned, every ally within 60 ft regains HP equal to half its HP maximum (no Virtue Breach effect).','feature',NULL,NULL,NULL)
) v(sid,level,name,description,feature_type,action_type,uses,dice)
ON CONFLICT (subclass_id, level, name) DO UPDATE SET description=EXCLUDED.description, feature_type=EXCLUDED.feature_type,
  approved_date=EXCLUDED.approved_date, action_type=EXCLUDED.action_type, uses=EXCLUDED.uses, dice=EXCLUDED.dice;

INSERT INTO subclass_levels (subclass_id, level, description)
SELECT subclass_id, level, name FROM subclass_features WHERE subclass_id IN (47,48,49)
ON CONFLICT (subclass_id, level) DO UPDATE SET description=EXCLUDED.description;

COMMIT;
