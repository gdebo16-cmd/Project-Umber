-- 10b: bridge callings <-> sub_classes so every live subclass has a calling home
-- Exact name match first; then insert legacy-named callings for the rest.
-- Rerunnable.

BEGIN;

ALTER TABLE callings
  ADD COLUMN IF NOT EXISTS legacy_subclass_id integer UNIQUE REFERENCES sub_classes(id);

-- Exact name match
UPDATE callings ca SET legacy_subclass_id = sc.id
FROM sub_classes sc
JOIN classes cl ON cl.id = sc.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
WHERE ca.role_id = ro.id
  AND lower(ca.name) = lower(sc.name)
  AND ca.legacy_subclass_id IS NULL;

-- Insert a calling for every sub_class that still has no calling pointing at it
INSERT INTO callings (key, name, role_id, description, sort_order, legacy_subclass_id,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  spellcasting, spellcasting_stat, caster_type,
  breach_effect, breach_drains_embers, black_gate_level, img_url)
SELECT
  'legacy_' || lower(regexp_replace(regexp_replace(sc.name, '[^a-zA-Z0-9]+', '_', 'g'), '^_|_$', '', 'g')),
  sc.name,
  ro.id,
  sc.description,
  200 + sc.id,
  sc.id,
  sc.armor_proficiencies, sc.weapon_proficiencies, sc.tool_proficiencies,
  sc.spellcasting, sc.spellcasting_stat, sc.caster_type,
  sc.breach_effect, sc.breach_drains_embers, sc.black_gate_level, sc.img_url
FROM sub_classes sc
JOIN classes cl ON cl.id = sc.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
WHERE NOT EXISTS (
  SELECT 1 FROM callings ca WHERE ca.legacy_subclass_id = sc.id
)
ON CONFLICT (key) DO UPDATE SET
  legacy_subclass_id = COALESCE(callings.legacy_subclass_id, EXCLUDED.legacy_subclass_id),
  armor_proficiencies = COALESCE(callings.armor_proficiencies, EXCLUDED.armor_proficiencies),
  weapon_proficiencies = COALESCE(callings.weapon_proficiencies, EXCLUDED.weapon_proficiencies),
  tool_proficiencies = COALESCE(callings.tool_proficiencies, EXCLUDED.tool_proficiencies),
  spellcasting = COALESCE(callings.spellcasting, EXCLUDED.spellcasting),
  spellcasting_stat = COALESCE(callings.spellcasting_stat, EXCLUDED.spellcasting_stat),
  caster_type = COALESCE(callings.caster_type, EXCLUDED.caster_type),
  breach_effect = COALESCE(callings.breach_effect, EXCLUDED.breach_effect),
  breach_drains_embers = EXCLUDED.breach_drains_embers,
  black_gate_level = COALESCE(callings.black_gate_level, EXCLUDED.black_gate_level),
  img_url = COALESCE(callings.img_url, EXCLUDED.img_url);

-- Fill meta on name-matched callings that still lack it
UPDATE callings ca SET
  armor_proficiencies = COALESCE(ca.armor_proficiencies, sc.armor_proficiencies),
  weapon_proficiencies = COALESCE(ca.weapon_proficiencies, sc.weapon_proficiencies),
  tool_proficiencies = COALESCE(ca.tool_proficiencies, sc.tool_proficiencies),
  spellcasting = COALESCE(ca.spellcasting, sc.spellcasting),
  spellcasting_stat = COALESCE(ca.spellcasting_stat, sc.spellcasting_stat),
  caster_type = COALESCE(ca.caster_type, sc.caster_type),
  breach_effect = COALESCE(ca.breach_effect, sc.breach_effect),
  breach_drains_embers = sc.breach_drains_embers,
  black_gate_level = COALESCE(ca.black_gate_level, sc.black_gate_level),
  img_url = COALESCE(ca.img_url, sc.img_url)
FROM sub_classes sc
WHERE ca.legacy_subclass_id = sc.id;

COMMIT;
