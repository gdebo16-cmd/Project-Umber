-- 06_characters_new_ids.sql
-- Add species_id / role_id / calling_id on characters (restructure branch only).
-- Keep race_id / class_id / subclass_id / subrace_id for legacy lookups.

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS species_id integer,
  ADD COLUMN IF NOT EXISTS role_id integer,
  ADD COLUMN IF NOT EXISTS calling_id integer;

ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_species_id_fkey;
ALTER TABLE characters ADD CONSTRAINT characters_species_id_fkey FOREIGN KEY (species_id) REFERENCES species(id);
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_role_id_fkey;
ALTER TABLE characters ADD CONSTRAINT characters_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_calling_id_fkey;
ALTER TABLE characters ADD CONSTRAINT characters_calling_id_fkey FOREIGN KEY (calling_id) REFERENCES callings(id);

CREATE INDEX IF NOT EXISTS characters_species_id_idx ON characters(species_id);
CREATE INDEX IF NOT EXISTS characters_role_id_idx ON characters(role_id);
CREATE INDEX IF NOT EXISTS characters_calling_id_idx ON characters(calling_id);

UPDATE characters ch
SET species_id = COALESCE(
  (
    SELECT child.id
    FROM subraces sr
    JOIN races r ON r.id = sr.race_id
    JOIN species parent ON parent.parent_id IS NULL AND parent.sort_order = r.id
    JOIN species child ON child.parent_id = parent.id AND lower(child.name) = lower(sr.name)
    WHERE sr.id = ch.subrace_id
  ),
  (
    SELECT parent.id
    FROM species parent
    WHERE parent.parent_id IS NULL AND parent.sort_order = ch.race_id
  )
)
WHERE ch.species_id IS NULL;

UPDATE characters ch
SET role_id = (
  SELECT ro.id
  FROM classes cl
  JOIN roles ro ON lower(ro.name) = lower(
    CASE cl.name
      WHEN 'Paladin' THEN 'Templar'
      WHEN 'Druid' THEN 'Seer'
      ELSE cl.name
    END
  )
  WHERE cl.id = ch.class_id
)
WHERE ch.role_id IS NULL AND ch.class_id IS NOT NULL;

UPDATE characters ch
SET calling_id = (
  SELECT ca.id
  FROM sub_classes sc
  JOIN classes cl ON cl.id = sc.class_id
  JOIN roles ro ON lower(ro.name) = lower(
    CASE cl.name
      WHEN 'Paladin' THEN 'Templar'
      WHEN 'Druid' THEN 'Seer'
      ELSE cl.name
    END
  )
  JOIN callings ca ON ca.role_id = ro.id AND lower(ca.name) = lower(sc.name)
  WHERE sc.id = ch.subclass_id
)
WHERE ch.calling_id IS NULL AND ch.subclass_id IS NOT NULL;
