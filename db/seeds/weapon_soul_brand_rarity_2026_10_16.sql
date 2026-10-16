-- Follow-up to 6da399c (Gabriel 2026-10-16). Idempotent.
-- 1) Soul Brand: no catalog weapon; a Soul Smith brands one weapon they own (character_weapons.soul_branded).
-- 2) Rarity scale: Common, Magical, Arcane, Mythical, Calamity (by tier: mundane, +1, +2, +3, +4/artifact).
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM character_weapons cw JOIN weapons w ON w.id = cw.weapon_id WHERE w.name = 'Soul Brand') THEN
    RAISE EXCEPTION 'Soul Brand weapon is in an inventory; not deleting';
  END IF;
END $$;
DELETE FROM weapons WHERE name = 'Soul Brand';

ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS soul_branded BOOLEAN NOT NULL DEFAULT false;
-- only one branded weapon per character (feature text: "your soul brand", singular)
CREATE UNIQUE INDEX IF NOT EXISTS character_weapons_one_soul_brand ON character_weapons (character_id) WHERE soul_branded;

UPDATE class_features SET description = replace(description,
  'Your soul brand: 1d8 bludgeoning or slashing (choose when called), versatile (1d10), thrown 20/60 (returns, from level 2). Versatile category; use CHA instead of STR for attack and damage.',
  'You brand one weapon you own as your soul brand (one at a time; tick Soul Brand on the weapon). Use CHA instead of STR for its attack and damage rolls.')
 WHERE class_id = (SELECT id FROM classes WHERE name = 'Soul Smith') AND name = 'Soul Brand'
   AND position('Your soul brand: 1d8' in description) > 0;

ALTER TABLE weapons DROP CONSTRAINT IF EXISTS weapons_rarity_check;
ALTER TABLE weapons ALTER COLUMN rarity SET DEFAULT 'Common';
UPDATE weapons SET rarity = CASE rarity
  WHEN 'Uncommon' THEN 'Magical' WHEN 'Rare' THEN 'Arcane' WHEN 'Very Rare' THEN 'Mythical'
  WHEN 'Legendary' THEN 'Mythical' WHEN 'Artifact' THEN 'Calamity' ELSE rarity END
 WHERE rarity IN ('Uncommon','Rare','Very Rare','Legendary','Artifact');
-- tier check against the +N suffix and attack bonus
UPDATE weapons SET rarity = CASE attack_bonus WHEN 0 THEN 'Common' WHEN 1 THEN 'Magical' WHEN 2 THEN 'Arcane' WHEN 3 THEN 'Mythical' ELSE 'Calamity' END
 WHERE NOT is_unique AND name ~ ' \+\d+$';
ALTER TABLE weapons ADD CONSTRAINT weapons_rarity_check CHECK (rarity IN ('Common','Magical','Arcane','Mythical','Calamity'));
COMMIT;
