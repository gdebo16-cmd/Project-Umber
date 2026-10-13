-- Per-spell attack type and homebrew accuracy tweak (added on top of the character's spell attack bonus).
-- Rule: 0 default; +1 melee/touch; +1 if damage <= 75% of the DMG single-target table for its level (not for multi-ray);
-- -1 multi-ray; -1 if damage >= 130% of table, -2 if >= 175%; clamped to -2..+2. Spells with no attack roll stay NULL.
-- Idempotent: only touches attack_type and base_to_hit_modifier.
BEGIN;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS attack_type TEXT CHECK (attack_type IN ('melee','ranged'));
ALTER TABLE spells ADD COLUMN IF NOT EXISTS base_to_hit_modifier INT;
UPDATE spells SET attack_type = NULL, base_to_hit_modifier = NULL WHERE attack_type IS NOT NULL OR base_to_hit_modifier IS NOT NULL;
UPDATE spells s SET attack_type = v.at, base_to_hit_modifier = v.mod FROM (VALUES
  (2, 'ranged', 0),
  (5, 'ranged', 0),
  (13, 'melee', 1),
  (16, 'ranged', 0),
  (31, 'ranged', 0),
  (39, 'ranged', 0),
  (57, 'melee', 1),
  (58, 'ranged', 0),
  (117, 'ranged', 1),
  (131, 'melee', 2),
  (133, 'melee', 2),
  (156, 'ranged', 0),
  (176, 'melee', 1),
  (200, 'melee', 1),
  (211, 'ranged', 0),
  (221, 'melee', 2),
  (231, 'ranged', 0),
  (235, 'melee', 2),
  (262, 'ranged', 0),
  (285, 'melee', 0),
  (334, 'melee', 1),
  (345, 'ranged', 0),
  (353, 'ranged', 0),
  (354, 'ranged', 0),
  (366, 'ranged', -1),
  (378, 'melee', 1),
  (392, 'melee', 2),
  (416, 'melee', 2)
) AS v(id, at, mod) WHERE s.id = v.id;
COMMIT;
