-- Stat + skill rename (2026-10-25). Run after skills_rework and unabbreviate_stats.
-- Stats (display/prose only; stored codes STR/DEX/CON/INT/WIS/CHA/SPD/LUC and column keys stay):
--   Strength->Might, Dexterity->Precision, Constitution->Endurance, Intelligence->Intellect,
--   Wisdom->Judgment, Charisma->Confidence. Speed, Luck unchanged.
-- Skills: Agility->Balance, Sleight->Finesse, Investigation->Knowledge, Spellcraft->Arcana,
--   Healing->Triage, Parley->Diplomacy, Guile->Misdirection, Performance->Showmanship,
--   Menace->Dominance, Might(skill)->Presence, Lore->Memory (+Faith where it fits),
--   Wildcraft/Beastcraft->Botany, Insight dropped (lineage bonuses + prose -> Awareness).
-- Idempotent: array/skill updates map new names to themselves; the prose block only runs while
-- classes.class_dc still has an old stat name (so the new stat "Might" is never re-read as the skill).
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.sk_el(x text, lore_both boolean) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE x
        WHEN 'Agility' THEN ARRAY['Balance']
        WHEN 'Sleight' THEN ARRAY['Finesse']
        WHEN 'Investigation' THEN ARRAY['Knowledge']
        WHEN 'Spellcraft' THEN ARRAY['Arcana']
        WHEN 'Healing' THEN ARRAY['Triage']
        WHEN 'Parley' THEN ARRAY['Diplomacy']
        WHEN 'Guile' THEN ARRAY['Misdirection']
        WHEN 'Performance' THEN ARRAY['Showmanship']
        WHEN 'Menace' THEN ARRAY['Dominance']
        WHEN 'Might' THEN ARRAY['Presence']
        WHEN 'Wildcraft' THEN ARRAY['Botany']
        WHEN 'Beastcraft' THEN ARRAY['Botany']
        WHEN 'Insight' THEN ARRAY[]::text[]
        WHEN 'Lore' THEN CASE WHEN lore_both THEN ARRAY['Memory','Faith'] ELSE ARRAY['Memory'] END
        ELSE ARRAY[x] END
$$;

CREATE OR REPLACE FUNCTION pg_temp.sk_map(arr text[], lore_both boolean) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN arr IS NULL THEN NULL ELSE COALESCE((
        SELECT array_agg(v ORDER BY o1, o2) FROM (
            SELECT DISTINCT ON (e.v) e.v, a.o1, e.o2
            FROM unnest(arr) WITH ORDINALITY a(x, o1)
            CROSS JOIN LATERAL unnest(pg_temp.sk_el(a.x, lore_both)) WITH ORDINALITY e(v, o2)
            ORDER BY e.v, a.o1, e.o2) d), ARRAY[]::text[]) END
$$;

-- characters keep their pick count: Lore -> Memory + Faith only if that doesn't add a pick
CREATE OR REPLACE FUNCTION pg_temp.sk_char(arr text[]) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN cardinality(pg_temp.sk_map(arr, true)) <= cardinality(arr)
                THEN pg_temp.sk_map(arr, true) ELSE pg_temp.sk_map(arr, false) END
$$;

CREATE OR REPLACE FUNCTION pg_temp.sk_prose(t text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    old text[] := ARRAY['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
    neu text[] := ARRAY['Might','Precision','Endurance','Intellect','Judgment','Confidence'];
    i int;
BEGIN
    IF t IS NULL THEN RETURN NULL; END IF;
    t := replace(t, 'a Insight or Awareness', 'an Awareness');
    t := regexp_replace(t, '\man Insight\M', 'an Awareness', 'g');
    t := regexp_replace(t, '\mInsight\M', 'Awareness', 'g');
    t := regexp_replace(t, '\man Investigation\M', 'a Knowledge', 'g');
    t := regexp_replace(t, '\mInvestigation\M', 'Knowledge', 'g');
    t := regexp_replace(t, '\mMight\M', 'Presence', 'g');          -- skill, before Strength -> Might
    t := regexp_replace(t, '\mAgility\M', 'Balance', 'g');
    t := regexp_replace(t, '\mSleight\M', 'Finesse', 'g');
    t := regexp_replace(t, '\mSpellcraft\M', 'Arcana', 'g');
    t := regexp_replace(t, '\mParley\M', 'Diplomacy', 'g');
    t := regexp_replace(t, '\mGuile\M', 'Misdirection', 'g');
    t := regexp_replace(t, '\mPerformance\M', 'Showmanship', 'g');
    t := regexp_replace(t, '\mMenace\M', 'Dominance', 'g');
    t := regexp_replace(t, '(?<!Stolen )\mLore\M', 'Memory', 'g');   -- not the "Stolen Lore" feature
    t := regexp_replace(t, '\mWildcraft\M(?! option)', 'Botany', 'g'); -- not the Druid "Wildcraft option" pool
    t := regexp_replace(t, '\mBeastcraft\M', 'Botany', 'g');
    FOR i IN 1..6 LOOP
        t := regexp_replace(t, '\m' || old[i] || '\M', neu[i], 'g');
    END LOOP;
    RETURN t;
END $$;

UPDATE classes SET skill_options = pg_temp.sk_map(skill_options, true)
    WHERE skill_options IS DISTINCT FROM pg_temp.sk_map(skill_options, true);
UPDATE classes SET skill_fixed = pg_temp.sk_map(skill_fixed, false)
    WHERE skill_fixed IS DISTINCT FROM pg_temp.sk_map(skill_fixed, false);
UPDATE characters SET skill_proficiencies = pg_temp.sk_char(skill_proficiencies)
    WHERE skill_proficiencies IS DISTINCT FROM pg_temp.sk_char(skill_proficiencies);
UPDATE race_lineage_bonuses SET skill = CASE skill WHEN 'Insight' THEN 'Awareness' ELSE (pg_temp.sk_el(skill, false))[1] END
    WHERE skill IS DISTINCT FROM CASE skill WHEN 'Insight' THEN 'Awareness' ELSE (pg_temp.sk_el(skill, false))[1] END;

DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM classes WHERE class_dc ~ '\m(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\M') THEN
        RAISE NOTICE 'prose already renamed, skipping';
        RETURN;
    END IF;
    UPDATE subclass_features SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE class_levels SET resources = pg_temp.sk_prose(resources) WHERE resources IS DISTINCT FROM pg_temp.sk_prose(resources);
    UPDATE class_features SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE spells SET base_description = pg_temp.sk_prose(base_description) WHERE base_description IS DISTINCT FROM pg_temp.sk_prose(base_description);
    UPDATE items SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE race_lineage_bonuses SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE class_levels SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE class_feature_options SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE classes SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE classes SET spellcasting = pg_temp.sk_prose(spellcasting) WHERE spellcasting IS DISTINCT FROM pg_temp.sk_prose(spellcasting);
    UPDATE subclass_levels SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE armor SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE primordial_blessings SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE primordial_blessings SET uses = pg_temp.sk_prose(uses) WHERE uses IS DISTINCT FROM pg_temp.sk_prose(uses);
    UPDATE class_features SET uses = pg_temp.sk_prose(uses) WHERE uses IS DISTINCT FROM pg_temp.sk_prose(uses);
    UPDATE weapon_category SET definition = pg_temp.sk_prose(definition) WHERE definition IS DISTINCT FROM pg_temp.sk_prose(definition);
    UPDATE subraces SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE subclass_features SET uses = pg_temp.sk_prose(uses) WHERE uses IS DISTINCT FROM pg_temp.sk_prose(uses);
    UPDATE sub_classes SET spellcasting = pg_temp.sk_prose(spellcasting) WHERE spellcasting IS DISTINCT FROM pg_temp.sk_prose(spellcasting);
    UPDATE sub_classes SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE sub_classes SET breach_effect = pg_temp.sk_prose(breach_effect) WHERE breach_effect IS DISTINCT FROM pg_temp.sk_prose(breach_effect);
    UPDATE runes SET effect = pg_temp.sk_prose(effect) WHERE effect IS DISTINCT FROM pg_temp.sk_prose(effect);
    UPDATE personality_options SET perk = pg_temp.sk_prose(perk) WHERE perk IS DISTINCT FROM pg_temp.sk_prose(perk);
    UPDATE class_feature_options SET uses = pg_temp.sk_prose(uses) WHERE uses IS DISTINCT FROM pg_temp.sk_prose(uses);
    UPDATE weapons SET description = pg_temp.sk_prose(description) WHERE description IS DISTINCT FROM pg_temp.sk_prose(description);
    UPDATE classes SET class_dc = pg_temp.sk_prose(class_dc) WHERE class_dc IS DISTINCT FROM pg_temp.sk_prose(class_dc);
END $do$;

COMMIT;
