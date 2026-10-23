-- Codex ruling: Lancer L7 option A is just Lunging Advance; Haft Parry always granted. Idempotent.
UPDATE class_features SET options = array_replace(options, 'Lunging Advance + Haft Parry', 'Lunging Advance')
 WHERE 'Lunging Advance + Haft Parry' = ANY(options);
UPDATE class_feature_options SET pool = 'Lunging Advance' WHERE pool = 'Lunging Advance + Haft Parry';
UPDATE characters SET feature_choices = replace(feature_choices::text, '"Lunging Advance + Haft Parry"', '"Lunging Advance"')::jsonb
 WHERE feature_choices::text LIKE '%"Lunging Advance + Haft Parry"%';