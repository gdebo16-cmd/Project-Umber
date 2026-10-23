-- Class rework follow-ups (Gabriel 2026-10-16): ability-score picks on boost rows, Primordial Ascent pick,
-- existing-character migration (keep current boosts + one free re-pick). Idempotent: safe to re-run.
BEGIN;
-- 1. Boost rows: +2 to one score or a blessing; Ascent: +1 to one score. 'Kept boost (already in scores)' marks a boost an
--    existing character already had in its scores (migration only; can't be newly picked).
UPDATE class_features SET options = ARRAY['+2 STR','+2 DEX','+2 CON','+2 INT','+2 WIS','+2 CHA','Hearthblood','Steady Bulwark','Swiftfoot','Mender''s Touch','Warding Word','Second Breath','Kindred Rally','Iron Resolve','Unshaken','Heavy Hand','Deadeye Draw','Twin Fangs','Spell Edge','Elemental Bite','Crushing Momentum','Finishing Blow','Bleeding Cut','Overwhelm','Night-Eyed','Keen Wits','Ever-Watchful','Silver Tongue','Gravecaller','Death''s Margin','Many Faces','Trickster''s Feint','Veilsight','Kept boost (already in scores)'], choice_count = 1 WHERE name = 'Ability Boost' AND feature_type = 'boost';
UPDATE class_features SET options = ARRAY['+1 STR','+1 DEX','+1 CON','+1 INT','+1 WIS','+1 CHA','Kept boost (already in scores)'], choice_count = 1,
  description = '+1 to one ability score (within the new cap of 26).' WHERE name = 'Primordial Ascent';

-- 2. Migration flags. New characters default to migrated (no kept boosts).
ALTER TABLE characters ADD COLUMN IF NOT EXISTS boost_migrated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS boost_repick_available BOOLEAN NOT NULL DEFAULT false;

-- 3. Existing characters: owed picks = new pick rows at or below their level; their old boosts
--    (4/8/12/16/19/22/26/29 at or below their level) are already in their scores, so the first
--    min(old, owed) pick rows (Ascent counts last) are marked kept. One free re-pick.
WITH rows AS (
  SELECT ch.id AS char_id, f.id AS fid,
         row_number() OVER (PARTITION BY ch.id ORDER BY f.level, f.id) AS n,
         (SELECT count(*) FROM unnest(ARRAY[4,8,12,16,19,22,26,29]) o WHERE o <= ch.level) AS old_boosts
    FROM characters ch
    JOIN class_features f ON f.class_id = ch.class_id AND f.level <= ch.level
                         AND f.name IN ('Ability Boost', 'Primordial Ascent')
   WHERE NOT ch.boost_migrated
), kept AS (
  SELECT char_id, jsonb_object_agg('class:' || fid, jsonb_build_array('Kept boost (already in scores)')) AS picks
    FROM rows WHERE n <= old_boosts GROUP BY char_id
)
UPDATE characters ch
   SET feature_choices = kept.picks || ch.feature_choices,
       boost_repick_available = true
  FROM kept WHERE kept.char_id = ch.id AND NOT ch.boost_migrated;
UPDATE characters SET boost_migrated = true WHERE NOT boost_migrated;
ALTER TABLE characters ALTER COLUMN boost_migrated SET DEFAULT true;
COMMIT;
SELECT count(*) AS characters, count(*) FILTER (WHERE boost_repick_available) AS with_repick,
       (SELECT count(*) FROM class_features WHERE name = 'Ability Boost' AND cardinality(options) = 34) AS boost_rows,
       (SELECT count(*) FROM class_features WHERE name = 'Primordial Ascent' AND cardinality(options) = 7) AS ascent_rows
  FROM characters;
