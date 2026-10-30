-- 09: species meta + affinity elements (restructure branch)
-- Rerunnable. Does not drop race_affinity_elements.

BEGIN;

ALTER TABLE species
  ADD COLUMN IF NOT EXISTS darkvision boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS creature_type text,
  ADD COLUMN IF NOT EXISTS resistances text,
  ADD COLUMN IF NOT EXISTS signature_state_id integer REFERENCES spell_state(id),
  ADD COLUMN IF NOT EXISTS race_spell_id integer REFERENCES spells(id);

UPDATE species s SET
  darkvision = COALESCE(r.darkvision, false),
  creature_type = r.creature_type,
  resistances = r.resistances,
  signature_state_id = r.signature_state_id,
  race_spell_id = r.race_spell_id
FROM races r
WHERE s.parent_id IS NULL AND s.sort_order = r.id;

UPDATE species child SET
  darkvision = COALESCE(child.darkvision, parent.darkvision),
  creature_type = COALESCE(child.creature_type, parent.creature_type),
  resistances = COALESCE(child.resistances, parent.resistances),
  signature_state_id = COALESCE(child.signature_state_id, parent.signature_state_id),
  race_spell_id = COALESCE(child.race_spell_id, parent.race_spell_id)
FROM species parent
WHERE child.parent_id = parent.id;

CREATE TABLE IF NOT EXISTS species_affinity_elements (
  species_id integer NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  element_id integer NOT NULL REFERENCES spell_element(id) ON DELETE CASCADE,
  PRIMARY KEY (species_id, element_id)
);

INSERT INTO species_affinity_elements (species_id, element_id)
SELECT s.id, rae.element_id
FROM race_affinity_elements rae
JOIN species s ON s.parent_id IS NULL AND s.sort_order = rae.race_id
WHERE rae.subrace_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO species_affinity_elements (species_id, element_id)
SELECT child.id, rae.element_id
FROM race_affinity_elements rae
JOIN subraces sr ON sr.id = rae.subrace_id
JOIN races r ON r.id = sr.race_id
JOIN species parent ON parent.parent_id IS NULL AND parent.sort_order = r.id
JOIN species child ON child.parent_id = parent.id AND lower(child.name) = lower(sr.name)
ON CONFLICT DO NOTHING;

COMMIT;
