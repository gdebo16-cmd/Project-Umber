-- Unabbreviate stats and Proficiency Bonus in prose columns (no saving throws in this system).
-- Idempotent: the output never matches the patterns again. Code columns (spells.opponent_save_roll,
-- classes.primary_stat / spellcasting_stat, sub_classes.spellcasting_stat, characters.plus*_stat,
-- primordial_blessings.prerequisite, which utils/abilityBoosts.js parses) are left alone.
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.unab(t text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    ab text[] := ARRAY['STR','DEX','CON','INT','WIS','CHA','SPD','LUC'];
    fu text[] := ARRAY['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma','Speed','Luck'];
    i int;
BEGIN
    IF t IS NULL THEN RETURN NULL; END IF;
    FOR i IN 1..8 LOOP
        t := regexp_replace(t, '\m' || ab[i] || '\M', fu[i], 'g');
    END LOOP;
    FOR i IN 1..8 LOOP
        t := regexp_replace(t, '\m' || fu[i] || '\s+(saving throws|saves)\M', fu[i] || ' rolls', 'gi');
        t := regexp_replace(t, '\m' || fu[i] || '\s+(saving throw|save)\M', fu[i] || ' roll', 'gi');
        t := regexp_replace(t, '\m' || fu[i] || ' mod\M', fu[i] || ' modifier', 'g');
    END LOOP;
    t := regexp_replace(t, '\mPB\M', 'Proficiency Bonus', 'g');
    t := regexp_replace(t, '\m[Pp]rof(\.|iciency)? bonus\M', 'Proficiency Bonus', 'g');
    RETURN t;
END $$;
UPDATE subclass_features SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE class_levels SET resources = pg_temp.unab(resources) WHERE resources IS DISTINCT FROM pg_temp.unab(resources);
UPDATE class_features SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE spells SET base_description = pg_temp.unab(base_description) WHERE base_description IS DISTINCT FROM pg_temp.unab(base_description);
UPDATE items SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE class_levels SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE race_lineage_bonuses SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE class_feature_options SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE subclass_features SET uses = pg_temp.unab(uses) WHERE uses IS DISTINCT FROM pg_temp.unab(uses);
UPDATE armor SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE classes SET class_dc = pg_temp.unab(class_dc) WHERE class_dc IS DISTINCT FROM pg_temp.unab(class_dc);
UPDATE classes SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE subclass_levels SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE primordial_blessings SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE classes SET spellcasting = pg_temp.unab(spellcasting) WHERE spellcasting IS DISTINCT FROM pg_temp.unab(spellcasting);
UPDATE class_feature_options SET uses = pg_temp.unab(uses) WHERE uses IS DISTINCT FROM pg_temp.unab(uses);
UPDATE class_features SET uses = pg_temp.unab(uses) WHERE uses IS DISTINCT FROM pg_temp.unab(uses);
UPDATE primordial_blessings SET uses = pg_temp.unab(uses) WHERE uses IS DISTINCT FROM pg_temp.unab(uses);
UPDATE subraces SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE weapon_category SET definition = pg_temp.unab(definition) WHERE definition IS DISTINCT FROM pg_temp.unab(definition);
UPDATE sub_classes SET breach_effect = pg_temp.unab(breach_effect) WHERE breach_effect IS DISTINCT FROM pg_temp.unab(breach_effect);
UPDATE sub_classes SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);
UPDATE runes SET effect = pg_temp.unab(effect) WHERE effect IS DISTINCT FROM pg_temp.unab(effect);
UPDATE sub_classes SET spellcasting = pg_temp.unab(spellcasting) WHERE spellcasting IS DISTINCT FROM pg_temp.unab(spellcasting);
UPDATE personality_options SET perk = pg_temp.unab(perk) WHERE perk IS DISTINCT FROM pg_temp.unab(perk);
UPDATE weapons SET description = pg_temp.unab(description) WHERE description IS DISTINCT FROM pg_temp.unab(description);

COMMIT;
