-- Cantrip beam scaling as data (Gabriel 2026-10-16). Idempotent.
-- beam_scaling = [{ "level": character level, "beams": beams from that level }, ...]; NULL = 1 beam.
ALTER TABLE spells ADD COLUMN IF NOT EXISTS beam_scaling jsonb;

UPDATE spells SET beam_scaling = '[{"level":1,"beams":1},{"level":5,"beams":2},{"level":11,"beams":3},{"level":17,"beams":4}]'::jsonb
WHERE name IN ('Eldritch Blast', 'Grace Bolt');
