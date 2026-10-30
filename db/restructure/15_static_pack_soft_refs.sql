-- 15_static_pack_soft_refs.sql
-- Drop foreign keys from player tables to rulebook/static catalogs so catalogs can live in JSON.
-- Keep integer/text ids as soft refs (ids stay stable). Do NOT drop catalog tables yet.

-- characters -> static catalogs
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_alignment_code_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_armor_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_calling_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_class_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_lifestyle_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_outlook_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_race_element_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_race_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_role_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_shield_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_species_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_subclass_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_subrace_id_fkey;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_upbringing_id_fkey;

-- owned gear -> catalogs
ALTER TABLE character_armor DROP CONSTRAINT IF EXISTS character_armor_armor_id_fkey;
ALTER TABLE character_items DROP CONSTRAINT IF EXISTS character_items_item_id_fkey;
ALTER TABLE character_weapons DROP CONSTRAINT IF EXISTS character_weapons_weapon_id_fkey;

-- inscribed runes -> rune catalog
ALTER TABLE item_runes DROP CONSTRAINT IF EXISTS item_runes_rune_id_fkey;