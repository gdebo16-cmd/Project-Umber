-- Proficiencies cleanup (idempotent). Display lists only what the character IS proficient in.
ALTER TABLE sub_classes ADD COLUMN IF NOT EXISTS armor_proficiencies text;
ALTER TABLE sub_classes ADD COLUMN IF NOT EXISTS weapon_proficiencies text;
ALTER TABLE sub_classes ADD COLUMN IF NOT EXISTS tool_proficiencies text;

UPDATE classes c SET armor_proficiencies=v.a, weapon_proficiencies=v.w, tool_proficiencies=v.t
FROM (VALUES
 (1,'Light Armor, Medium Armor, Heavy Armor, Shields','Simple Weapons, Martial Weapons',NULL),
 (2,NULL,'Quarterstaffs, Daggers, Darts, Slings',NULL),
 (3,'Light Armor','Simple Weapons, Ritual Blade (Dagger or Sickle)','Herbalism Kit'),
 (4,'Light Armor, Medium Armor, Heavy Armor, Shields','Simple Weapons, Martial Weapons',NULL),
 (5,'Light Armor','Simple Weapons, Finesse Martial Weapons, Hand Crossbows, Shortbows or Longbows (choose one)','Thieves'' Tools'),
 (6,'Light Armor, Medium Armor, Heavy Armor, Shields','Simple Melee Weapons, Martial Melee Weapons, Lances',NULL),
 (7,'Light Armor, Medium Armor, Shields','Simple Weapons, Martial Weapons',NULL),
 (8,'Light Armor (Non-metal), Medium Armor (Non-metal), Shields (Non-metal)','Simple Weapons, Scimitars, Sickles, Spears, Quarterstaffs, Darts, Slings, Clubs','Herbalism Kit'),
 (9,'Light Armor, Medium Armor','Simple Melee Weapons, Martial Melee Weapons',NULL),
 (10,NULL,'Unarmed Strikes, Simple Melee Weapons, Knuckles, Cestus, Gauntlets',NULL),
 (11,'Light Armor, Medium Armor, Heavy Armor, Shields','Simple Melee Weapons, Spears, Pikes, Glaives, Halberds, Lances, Polearms',NULL),
 (12,'Light Armor, Medium Armor, Shields','Simple Weapons',NULL),
 (13,'Light Armor','Simple Weapons',NULL),
 (14,'Light Armor, Shields','Simple Weapons, Rapiers, Shortswords, Hand Crossbows','One Musical Instrument')
) v(id,a,w,t) WHERE c.id=v.id;

UPDATE sub_classes SET armor_proficiencies='Medium Armor', weapon_proficiencies='Martial Melee Weapons' WHERE id=11;
UPDATE sub_classes SET armor_proficiencies='Light Armor', weapon_proficiencies='Martial Blades' WHERE id=5;
