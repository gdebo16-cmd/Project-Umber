-- 08: copy class/subclass meta onto roles/callings (restructure branch)
-- Rerunnable. Does not drop or rename legacy tables.

BEGIN;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS score_key text,
  ADD COLUMN IF NOT EXISTS saving_throws text[],
  ADD COLUMN IF NOT EXISTS armor_proficiencies text,
  ADD COLUMN IF NOT EXISTS weapon_proficiencies text,
  ADD COLUMN IF NOT EXISTS tool_proficiencies text,
  ADD COLUMN IF NOT EXISTS skill_choice_count integer,
  ADD COLUMN IF NOT EXISTS skill_options text[],
  ADD COLUMN IF NOT EXISTS skill_fixed text[],
  ADD COLUMN IF NOT EXISTS spellcasting text,
  ADD COLUMN IF NOT EXISTS spellcasting_stat text,
  ADD COLUMN IF NOT EXISTS caster_type text,
  ADD COLUMN IF NOT EXISTS subclass_level integer,
  ADD COLUMN IF NOT EXISTS has_embers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS crack_max integer,
  ADD COLUMN IF NOT EXISTS breach_dc integer,
  ADD COLUMN IF NOT EXISTS breach_dc_scaling jsonb,
  ADD COLUMN IF NOT EXISTS img_url text;

ALTER TABLE callings
  ADD COLUMN IF NOT EXISTS armor_proficiencies text,
  ADD COLUMN IF NOT EXISTS weapon_proficiencies text,
  ADD COLUMN IF NOT EXISTS tool_proficiencies text,
  ADD COLUMN IF NOT EXISTS spellcasting text,
  ADD COLUMN IF NOT EXISTS spellcasting_stat text,
  ADD COLUMN IF NOT EXISTS caster_type text,
  ADD COLUMN IF NOT EXISTS breach_effect text,
  ADD COLUMN IF NOT EXISTS breach_drains_embers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS black_gate_level integer,
  ADD COLUMN IF NOT EXISTS img_url text;

UPDATE roles ro SET
  score_key = cl.primary_stat,
  saving_throws = cl.saving_throws,
  armor_proficiencies = cl.armor_proficiencies,
  weapon_proficiencies = cl.weapon_proficiencies,
  tool_proficiencies = cl.tool_proficiencies,
  skill_choice_count = cl.skill_choice_count,
  skill_options = cl.skill_options,
  skill_fixed = cl.skill_fixed,
  spellcasting = cl.spellcasting,
  spellcasting_stat = cl.spellcasting_stat,
  caster_type = cl.caster_type,
  subclass_level = cl.subclass_level,
  has_embers = cl.has_embers,
  crack_max = cl.crack_max,
  breach_dc = cl.breach_dc,
  breach_dc_scaling = cl.breach_dc_scaling,
  img_url = cl.img_url
FROM classes cl
WHERE lower(cl.name) = lower(
  CASE ro.name WHEN 'Templar' THEN 'Paladin' WHEN 'Seer' THEN 'Druid' ELSE ro.name END
);

UPDATE callings ca SET
  armor_proficiencies = sc.armor_proficiencies,
  weapon_proficiencies = sc.weapon_proficiencies,
  tool_proficiencies = sc.tool_proficiencies,
  spellcasting = sc.spellcasting,
  spellcasting_stat = sc.spellcasting_stat,
  caster_type = sc.caster_type,
  breach_effect = sc.breach_effect,
  breach_drains_embers = sc.breach_drains_embers,
  black_gate_level = sc.black_gate_level,
  img_url = sc.img_url
FROM sub_classes sc
JOIN classes cl ON cl.id = sc.class_id
JOIN roles ro ON lower(ro.name) = lower(
  CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
)
WHERE ca.role_id = ro.id AND lower(ca.name) = lower(sc.name);

COMMIT;
