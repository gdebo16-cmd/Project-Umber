-- 11: remap characters.feature_choices keys to role/calling link_ids
-- Keys stay class:<id> / subclass:<id> for API shape; ids become link_id values.
-- Rerunnable: only rewrites keys that still match legacy_feature_id.

BEGIN;

-- Build remap: legacy class_features.id -> role_features.link_id
-- and legacy subclass_features.id -> calling_features.link_id

UPDATE characters ch SET feature_choices = (
  SELECT COALESCE(jsonb_object_agg(new_key, value), '{}'::jsonb)
  FROM (
    SELECT
      CASE
        WHEN k LIKE 'class:%' THEN
          COALESCE(
            (SELECT 'class:' || rf.link_id::text
             FROM role_features rf
             WHERE rf.legacy_feature_id = NULLIF(substr(k, 7), '')::int
               AND rf.link_id IS NOT NULL
             ORDER BY rf.link_id LIMIT 1),
            k
          )
        WHEN k LIKE 'subclass:%' THEN
          COALESCE(
            (SELECT 'subclass:' || cf.link_id::text
             FROM calling_features cf
             WHERE cf.legacy_feature_id = NULLIF(substr(k, 10), '')::int
               AND cf.link_id IS NOT NULL
             ORDER BY cf.link_id LIMIT 1),
            k
          )
        ELSE k
      END AS new_key,
      v AS value
    FROM jsonb_each(ch.feature_choices) AS e(k, v)
  ) remapped
)
WHERE feature_choices IS NOT NULL
  AND feature_choices <> '{}'::jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_object_keys(feature_choices) k
    WHERE k LIKE 'class:%' OR k LIKE 'subclass:%'
  );

COMMIT;
