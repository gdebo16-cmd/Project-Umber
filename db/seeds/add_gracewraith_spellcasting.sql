-- Gracewraith (class 15) spellcasting + Paladin (class 4) cantrips. Gabriel approved 2026-10-16.
-- Idempotent: safe to re-run.
BEGIN;

-- 1. Class columns + description
UPDATE classes SET
  spellcasting = 'Half caster from level 2, INT; slots per Shared Frame half-caster table (top tier 6th); Paladin spell list; 2 cantrips from level 2 (Cleric cantrips + Chainlight); sigil blade is a focus for Gracewraith spells; spell DC 8 + proficiency + INT',
  spellcasting_stat = 'INT',
  caster_type = 'half',
  description = replace(replace(description,
      'Spellcasting: None.', 'Spellcasting: half caster (INT, Paladin spell list) from level 2.'),
      'subclasses: Archon, Seraph, Virtue.', 'subclasses: Archonbound, Seraphbound, Virtuebound.')
WHERE id = 15;

-- 2. Slots: copy the Paladin table exactly
INSERT INTO class_spell_slots (class_id, level, slot_level, slots)
SELECT 15, level, slot_level, slots FROM class_spell_slots WHERE class_id = 4
ON CONFLICT (class_id, level, slot_level) DO UPDATE SET slots = EXCLUDED.slots;

-- 3. Spell list: Gracewraith gets every Paladin base-class spell at the same unlock level
INSERT INTO class_spells (class_id, subclass_id, spell_id, min_level)
SELECT 15, NULL, spell_id, min_level FROM class_spells WHERE class_id = 4 AND subclass_id IS NULL
ON CONFLICT (class_id, COALESCE(subclass_id, 0), spell_id) DO NOTHING;

-- 4. SRD Cleric cantrips for Paladin and Gracewraith, from level 2
INSERT INTO class_spells (class_id, subclass_id, spell_id, min_level)
SELECT c.id, NULL, s.id, 2
FROM (VALUES (4), (15)) c(id)
CROSS JOIN spells s
WHERE s.base_level = 0 AND s.name IN ('Guidance','Light','Mending','Resistance','Sacred Flame','Spare the Dying','Thaumaturgy')
ON CONFLICT (class_id, COALESCE(subclass_id, 0), spell_id) DO UPDATE SET min_level = 2;

-- 5. Chainlight: Gracewraith-exclusive cantrip (exclusive = only a class 15 row in class_spells)
INSERT INTO spells (name, base_level, casting_time, range, element_id, state_id, alignment_id, base_damage_dice, attack_type, base_to_hit_modifier, base_description)
SELECT 'Chainlight', 0, 1, 60, 12, 11, 2, '1d8', 'ranged', 0, ''
WHERE NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Chainlight');

UPDATE spells SET base_level = 0, casting_time = 1, range = 60, element_id = 12, state_id = 11, alignment_id = 2,
  base_damage_dice = '1d8', attack_type = 'ranged', base_to_hit_modifier = 0,
  base_description = 'Gracewraith only. Evocation cantrip; 1 action; range 60 ft; components V, S. A chain of radiant light lashes out. Make a ranged spell attack (proficiency + INT). On a hit, the target takes 1d8 radiant damage (don''t add INT to damage). Beams: 1 at levels 1-4, 2 at 5-10, 3 at 11-16, 4 at 17+. Each beam is a separate attack roll; aim them at the same target or different ones. Once per turn, when a beam hits a Large or smaller creature, you can pull it up to 5 ft toward you. Counts toward your cantrip limit.'
WHERE name = 'Chainlight';

INSERT INTO class_spells (class_id, subclass_id, spell_id, min_level)
SELECT 15, NULL, id, 2 FROM spells WHERE name = 'Chainlight'
ON CONFLICT (class_id, COALESCE(subclass_id, 0), spell_id) DO UPDATE SET min_level = 2;

-- 6. Level 2 features
INSERT INTO class_features (class_id, level, name, description, feature_type, source, approved_date, sort_order, action_type, uses)
VALUES
 (15, 2, 'Spellcasting', 'You are a half caster using the Paladin spell list and slot table (top slot 6th at level 21). INT is your spellcasting ability: spell save DC = 8 + proficiency + INT, spell attack = proficiency + INT. Spells known = ceil(level / 2) + 1. You know 2 cantrips from the Cleric cantrip list (guidance, light, mending, resistance, sacred flame, spare the dying, thaumaturgy) or Chainlight. A sigil blade is a spellcasting focus for Gracewraith spells only. Spell slots and Radiance are tracked separately; spells never add or remove Cracks.', 'feature', 'approved', '2026-10-16', 3, NULL, NULL),
 (15, 2, 'Kindled Slot', 'Once per long rest, as a bonus action, expend a spell slot to regain Radiance equal to the slot''s level (can''t exceed your pool maximum). No reverse conversion.', 'feature', 'approved', '2026-10-16', 4, 'bonus', '1/long rest')
ON CONFLICT (class_id, level, name) DO UPDATE SET description = EXCLUDED.description, feature_type = EXCLUDED.feature_type,
  source = EXCLUDED.source, approved_date = EXCLUDED.approved_date, sort_order = EXCLUDED.sort_order,
  action_type = EXCLUDED.action_type, uses = EXCLUDED.uses;

UPDATE class_levels SET description = 'Reseal + Chain Reach + Spellcasting + Kindled Slot'
WHERE class_id = 15 AND level = 2 AND description = 'Reseal + Chain Reach';

COMMIT;
