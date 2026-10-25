-- Spell renames (2026-10-25b). Matched by id plus the old name, so re-runs and other spells are untouched. Element and colour unchanged.
BEGIN;
UPDATE spells SET name = 'Prey Brand'   WHERE id = 278 AND name = 'Mark of the Hunter';
UPDATE spells SET name = 'Hollow Choir' WHERE id = 45  AND name = 'Choir of the Hollow';
UPDATE spells SET name = 'Scar Ledger'  WHERE id = 70  AND name = 'Witherbrand';
UPDATE spells SET name = 'Steady Hands' WHERE id = 27  AND name = 'Ironblood Oath';
-- New L3 Body transmute Titan's Sinew (local id 804) becomes Ironbrawn. The old L4 Titan's Sinew (#107) keeps its name.
-- The level/element/state guard stops this touching #107 if the id differs on another database.
UPDATE spells SET name = 'Ironbrawn'    WHERE id = 804 AND name = 'Titan''s Sinew' AND base_level = 3 AND element_id = 16
  AND state_id = (SELECT id FROM spell_state WHERE name = 'transmute');
COMMIT;
