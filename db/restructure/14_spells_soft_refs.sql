-- 14_spells_soft_refs.sql
-- Drop foreign keys that point at spells(id) so the catalog can live in JSON only.
-- character_spells / items / race_spell_id keep integer spell_id values (soft refs).
-- Do NOT drop catalog tables yet.

ALTER TABLE character_spells DROP CONSTRAINT IF EXISTS character_spells_spell_id_fkey;
ALTER TABLE role_spells DROP CONSTRAINT IF EXISTS role_spells_spell_id_fkey;
ALTER TABLE class_spells DROP CONSTRAINT IF EXISTS class_spells_spell_id_fkey;
ALTER TABLE spell_upcasts DROP CONSTRAINT IF EXISTS spell_upcasts_spell_id_fkey;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_spell_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_race_spell_id_fkey;
ALTER TABLE races DROP CONSTRAINT IF EXISTS races_race_spell_id_fkey;
ALTER TABLE species DROP CONSTRAINT IF EXISTS species_race_spell_id_fkey;