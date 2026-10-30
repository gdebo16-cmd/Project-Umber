-- Move darkvision and resistances from old races into traits (restructure branch)
BEGIN;

-- 1. One trait per resistance type, written once
INSERT INTO features (key, name, type, description, data)
SELECT 'resist_' || lower(t), t || ' Resistance', 'passive',
       'You take half damage from ' || lower(t) || ' damage.',
       jsonb_build_object('resistance', lower(t))
FROM (VALUES ('Poison'),('Fire'),('Cold'),('Necrotic'),('Radiant'),('Lightning')) v(t)
ON CONFLICT (key) DO NOTHING;

-- 2. Darkvision for every species that had it
INSERT INTO species_features (species_id, feature_id, level)
SELECT s.id, f.id, 1
FROM races r
JOIN species s  ON s.sort_order = r.id AND s.parent_id IS NULL
JOIN features f ON f.key = 'darkvision'
WHERE r.darkvision
ON CONFLICT DO NOTHING;

-- 3. Resistances for every species that had them
INSERT INTO species_features (species_id, feature_id, level)
SELECT s.id, f.id, 1
FROM races r
JOIN species s ON s.sort_order = r.id AND s.parent_id IS NULL
CROSS JOIN LATERAL unnest(string_to_array(r.resistances, ',')) AS x(t)
JOIN features f ON f.key = 'resist_' || lower(trim(x.t))
ON CONFLICT DO NOTHING;

-- Check
SELECT s.name AS species, string_agg(f.name, ', ' ORDER BY f.name) AS traits
FROM species s
JOIN species_features sf ON sf.species_id = s.id
JOIN features f ON f.id = sf.feature_id
GROUP BY s.name, s.sort_order ORDER BY s.sort_order;

COMMIT;