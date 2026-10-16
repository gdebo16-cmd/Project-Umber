-- Moss Agate Vellari sub-race (approved 2026-10-15). Safe to re-run.
INSERT INTO subraces (race_id, name, slug, description, img_url)
VALUES (12, 'Moss Agate', 'moss-agate', 'Frosted white crystal fur veined with dark-green moss agate. Resistance to acid damage.', '/races/vellari-moss-agate.png')
ON CONFLICT (race_id, slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, img_url = EXCLUDED.img_url;