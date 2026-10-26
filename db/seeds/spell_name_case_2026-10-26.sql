-- 2026-10-26: Title-case spell state names and the 'temporal' element (idempotent; safe to re-run)
-- Code compares states with lower(name) / toLowerCase, so the casing change is display-only.
BEGIN;
UPDATE spell_state SET name = initcap(name) WHERE name <> initcap(name);
UPDATE spell_element SET name = 'Temporal' WHERE name = 'temporal';
COMMIT;
