-- Gabriel locked 2026-10-16: Soul brand mark + Call the Brand (16-soul-smith.md), Inscribe Runes (rune-weaver-inscribe-runes.md,
-- changes-for-major.md section 6). Idempotent. Items map onto character_weapons / character_armor (there is no character_items table).
BEGIN;

-- ---------- Soul Smith ----------
UPDATE class_features SET description =
 'The soul brand is a mark, not a weapon. You place it on one weapon you own (tick Soul Brand on the weapon): touch it for 1 minute (can be done during a short or long rest). Branding a new weapon ends the old brand at once. The branded weapon uses its own category and stats; you can use CHA instead of STR or DEX for its attack and damage rolls, and it can''t be disarmed from you while you''re conscious. The brand can''t go on a weapon larger than your size. Features that name the soul brand mean your branded weapon. Oversized weapons: you''re proficient with weapons of any size. Large: +1 damage die, two-handed, heavy, loses light and finesse. Huge+: +2 dice and at most 2 attacks per turn with it. Soul Strike, Strain and subclass dice never grow with size.'
 WHERE name = 'Soul Brand' AND class_id = (SELECT id FROM classes WHERE name = 'Soul Smith');
UPDATE class_features SET action_type = 'bonus', uses = 'At will', description =
 'Bonus action, at will: your branded weapon flies or appears in your free hand from any distance on the same plane (recall fails if it''s on another plane). If someone else is holding it, they make a STR save against your class DC; on a failure it returns to you, on a success it stays and you can''t call it again until the start of your next turn. A creature attuned to it (a magic weapon) succeeds automatically. If the branded weapon has the thrown property, you can call it back after a throw as part of the same bonus action. Range: unlimited (same plane).'
 WHERE name = 'Call the Brand' AND class_id = (SELECT id FROM classes WHERE name = 'Soul Smith');

-- ---------- Runes ----------
CREATE TABLE IF NOT EXISTS runes (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  item_types TEXT[] NOT NULL,            -- weapon | armor | shield | gear
  min_level INT NOT NULL,
  effect TEXT NOT NULL,
  action_type TEXT,
  uses TEXT,
  dice TEXT,
  is_damage_rider BOOLEAN NOT NULL DEFAULT false,
  choice_param TEXT                      -- Warding Rune: damage type
);
INSERT INTO runes (name, item_types, min_level, effect, action_type, uses, dice, is_damage_rider, choice_param) VALUES
('Keen Rune', ARRAY['weapon'], 3, '+1 to attack rolls with this weapon.', 'passive', NULL, NULL, false, NULL),
('Lantern Rune', ARRAY['weapon','shield','gear'], 3, 'Sheds bright light 20 ft and dim light 20 ft more; on or off as a bonus action.', 'bonus', 'At will', NULL, false, NULL),
('Hush Rune', ARRAY['armor','gear'], 3, 'The item makes no noise; armor with it doesn''t impose disadvantage on Stealth.', 'passive', NULL, NULL, false, NULL),
('Anchor Rune', ARRAY['weapon','shield'], 3, 'The item can''t be disarmed or forcibly taken from its wielder while they''re conscious.', 'passive', NULL, NULL, false, NULL),
('Homing Rune', ARRAY['weapon'], 3, 'A thrown weapon returns to the thrower''s hand after the attack; ammunition fired is recovered after combat. (Thrown weapons or ranged weapons with ammunition.)', 'passive', NULL, NULL, false, NULL),
('Mending Rune', ARRAY['weapon','armor','shield','gear'], 6, 'The item repairs itself in 1 minute; once per long rest, its wearer or wielder reduces one hit''s damage by 1d6 + INT modifier (reaction).', 'reaction', '1/long rest', '1d6', false, NULL),
('Dusksight Rune', ARRAY['gear'], 6, 'The wearer gains darkvision 30 ft (+30 ft if they already have it). (Worn gear.)', 'passive', NULL, NULL, false, NULL),
('Fleet Rune', ARRAY['armor','gear'], 6, '+5 ft walking speed. (Armor or worn gear.)', 'passive', NULL, NULL, false, NULL),
('Ember Rune', ARRAY['weapon'], 10, '+1d4 fire damage on hits.', 'passive', 'Per hit', '1d4', true, NULL),
('Rime Rune', ARRAY['weapon'], 10, '+1d4 cold damage on hits.', 'passive', 'Per hit', '1d4', true, NULL),
('Spark Rune', ARRAY['weapon'], 10, '+1d4 lightning damage on hits.', 'passive', 'Per hit', '1d4', true, NULL),
('Gall Rune', ARRAY['weapon'], 10, '+1d4 acid damage on hits.', 'passive', 'Per hit', '1d4', true, NULL),
('Warding Rune', ARRAY['armor','shield','gear'], 14, 'Resistance to one damage type chosen when you inscribe it (not bludgeoning, piercing or slashing). (Armor, shield or worn gear.)', 'passive', NULL, NULL, false, 'damage_type'),
('Guard Rune', ARRAY['armor','shield'], 18, '+1 AC.', 'passive', NULL, NULL, false, NULL)
ON CONFLICT (name) DO UPDATE SET item_types = EXCLUDED.item_types, min_level = EXCLUDED.min_level, effect = EXCLUDED.effect,
  action_type = EXCLUDED.action_type, uses = EXCLUDED.uses, dice = EXCLUDED.dice, is_damage_rider = EXCLUDED.is_damage_rider, choice_param = EXCLUDED.choice_param;

-- one owned item = a character_weapons row or a character_armor row
CREATE TABLE IF NOT EXISTS item_runes (
  id SERIAL PRIMARY KEY,
  character_weapon_id INT REFERENCES character_weapons(id) ON DELETE CASCADE,
  character_armor_id INT REFERENCES character_armor(id) ON DELETE CASCADE,
  rune_id INT NOT NULL REFERENCES runes(id),
  inscribed_by_character_id INT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  choice_value TEXT,
  inscribed_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK ((character_weapon_id IS NULL) <> (character_armor_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS item_runes_weapon_rune ON item_runes (character_weapon_id, rune_id) WHERE character_weapon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS item_runes_armor_rune ON item_runes (character_armor_id, rune_id) WHERE character_armor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS item_runes_inscriber ON item_runes (inscribed_by_character_id);

ALTER TABLE characters ADD COLUMN IF NOT EXISTS runed_weapon_item_id INT REFERENCES character_weapons(id) ON DELETE SET NULL;

-- ---------- Rune Weaver L3 feature rows (02-mage.md) ----------
UPDATE subclass_features SET name = 'Inscribe Runes', description =
 'Proficiencies: Elegant One-Handed and Versatile weapon categories, and light armor; you can cast Mage spells while wearing light armor. Runes: you inscribe runes on items: 10 minutes per rune (can be done during a rest), no gold cost, permanent until removed, swapped freely on a long rest. Runes per item: 1 (2 at 10, 3 at 24). Active runes: 2 (3 at 6, 4 at 10, 5 at 14, 6 at 18, 7 at 24, 8 at 28); inscribing past the limit ends your oldest rune. One rune of each name per item, and one damage-rider rune (Ember, Rime, Spark, Gall) per weapon. Allies can use your runed items while you''re alive and on the same plane. Runed weapon: choose one weapon carrying at least one of your runes; you use INT instead of STR or DEX for its attack and damage rolls (change it on a long rest). Runic Strike: once per turn, when you hit with your runed weapon, the hit deals an extra 1d6 force damage (2d6 at 10, 3d6 at 18, 4d6 at 24). The rune limits and rune prerequisites rise at 6, 10, 14, 18, 24 and 28.'
 WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND name IN ('Runed Weapon and Runic Strike', 'Inscribe Runes') AND level = 3;
DELETE FROM subclass_features
 WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND name IN ('Inscribe Arms', 'Inscribe Armor', 'Inscribe Arms/Armor') AND level = 3;
-- changes-for-major.md section 9 (LOCKED): Rune-Hardened keeps the old Inscribe Arms HP: +1 max HP per Mage level.
-- hp_per_level is summed over the subclass features the character has reached and multiplied by level; stored max_hp stays the base.
ALTER TABLE subclass_features ADD COLUMN IF NOT EXISTS hp_per_level INT NOT NULL DEFAULT 0;
UPDATE subclass_features SET hp_per_level = 1,
  description = CASE WHEN description LIKE '%Rune-Hardened%' THEN description
    ELSE description || ' Rune-Hardened: your hit point maximum increases by 1 for each Mage level you have, and by 1 more each time you gain a Mage level.' END
  WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND name = 'Inscribe Runes' AND level = 3;
-- 02-mage.md Runeweaver L6-L28 LOCKED 2026-10-16: rows brought in line with the locked text (wording only; L18 and L24 already matched).
UPDATE subclass_features SET description = 'Ward recharge: once per turn, when you hit with your runed weapon, your Arcane Ward regains HP equal to your INT modifier (up to its maximum). Weave Attack: when you take the Attack action with your runed weapon, you can attack twice; you can replace one of those attacks with casting a Mage cantrip that takes an action (three attacks at 24).'
  WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND level = 6 AND name = 'Walking Ward';
UPDATE subclass_features SET description = 'Runic Strike becomes 2d6. When Runic Strike hits, you can brand one rune on the target until the start of your next turn: Binding (the target makes a STR save against your spell save DC; on a failure its speed is 0) or Sundering (the next attack roll against the target before then has advantage). Once per turn (tied to Runic Strike).'
  WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND level = 10 AND name = 'Bind Rune';
UPDATE subclass_features SET description = 'When you hit a creature with your runed weapon, you can detonate a glyph on it (no action; declare on the hit). Each creature of your choice within 10 ft of the target (including the target) makes a DEX save against your spell save DC, taking 5d8 force damage on a failure or half on a success. Uses: INT modifier (minimum 1) per long rest.'
  WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND level = 14 AND name = 'Glyphbomb';
UPDATE subclass_features SET description = 'Once per long rest, when you hit a creature with your runed weapon, you speak its unmaking-name. The target makes a CON save against your spell save DC. On a failure it takes 10d10 force damage and loses one damage resistance or immunity of your choice for 1 minute; on a success it takes half damage and loses nothing. Legends (story-gated) have advantage on the save.'
  WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND level = 28 AND name = 'Name of Unmaking';
UPDATE subclass_features SET source = 'approved' WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Rune Weaver') AND source NOT IN ('canon', 'approved');
COMMIT;
