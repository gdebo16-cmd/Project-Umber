-- Reaver becomes a half caster like the Wraith (Gabriel 2026-10-25). Idempotent; local first.
-- Spells are NOT added here: waiting for Codex's Reaver spell list.
-- Casting stat: Wraith uses INT; Reaver uses CHA (its primary stat).
BEGIN;
UPDATE classes
   SET caster_type = 'half',
       spellcasting_stat = 'CHA',
       spellcasting = 'Half caster from level 2, CHA; slots per Shared Frame half-caster table (top tier 6th), copied from the Wraith; spell list pending'
 WHERE name = 'Reaver';

-- class-level slots (subclass_id NULL) = the Wraith's progression; replace any earlier copy
DELETE FROM class_spell_slots
 WHERE class_id = (SELECT id FROM classes WHERE name = 'Reaver') AND subclass_id IS NULL;
INSERT INTO class_spell_slots (class_id, level, slot_level, slots, subclass_id)
SELECT (SELECT id FROM classes WHERE name = 'Reaver'), w.level, w.slot_level, w.slots, NULL
  FROM class_spell_slots w
 WHERE w.class_id = (SELECT id FROM classes WHERE name = 'Wraith') AND w.subclass_id IS NULL;
COMMIT;

-- CHANGE (Gabriel 2026-10-25): Mark of Possession is a full caster, CHA.
-- Its slot rows are replaced by a copy of the Songsmith's (full caster, CHA). Its 18 spells stay.
BEGIN;
UPDATE sub_classes
   SET caster_type = 'full',
       spellcasting_stat = 'CHA',
       spellcasting = 'Full caster from Reaver level 3, using CHA; slots copied from the Songsmith (Shared Frame full-caster table). Possession spell list; soul brand is the focus.'
 WHERE name = 'Mark of Possession'
   AND class_id = (SELECT id FROM classes WHERE name = 'Reaver');
DELETE FROM class_spell_slots
 WHERE subclass_id = (SELECT id FROM sub_classes WHERE name = 'Mark of Possession');
INSERT INTO class_spell_slots (class_id, level, slot_level, slots, subclass_id)
SELECT (SELECT id FROM classes WHERE name = 'Reaver'), s.level, s.slot_level, s.slots,
       (SELECT id FROM sub_classes WHERE name = 'Mark of Possession')
  FROM class_spell_slots s
 WHERE s.class_id = (SELECT id FROM classes WHERE name = 'Songsmith') AND s.subclass_id IS NULL;
COMMIT;
