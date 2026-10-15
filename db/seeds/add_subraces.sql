-- Sub-races: Lupine breeds and Vellari gem lines. Safe to run more than once.
BEGIN;
CREATE TABLE IF NOT EXISTS subraces (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    img_url TEXT,
    UNIQUE (race_id, slug)
);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS subrace_id INTEGER REFERENCES subraces(id) ON DELETE SET NULL;

INSERT INTO subraces (race_id, name, slug, description, img_url)
SELECT r.id, v.name, v.slug, v.description, v.img_url
FROM races r
JOIN (VALUES
    ('Vellari', 'Opal', 'opal', 'Pearly white fur, the classic Vellari look. Resistance to radiant damage.', '/races/vellari.png'),
    ('Vellari', 'Onyx', 'onyx', 'Black fur. Resistance to necrotic damage.', '/races/vellari-onyx.png'),
    ('Vellari', 'Amethyst', 'amethyst', 'Purple fur. Resistance to psychic damage.', '/races/vellari-amethyst.png'),
    ('Vellari', 'Topaz', 'topaz', 'Orange fur. Resistance to lightning damage.', '/races/vellari-topaz.png'),
    ('Vellari', 'Quartz', 'quartz', 'Clear crystal fur. Resistance to force damage.', '/races/vellari-quartz.png'),
    ('Vellari', 'Emerald', 'emerald', 'Green fur. Resistance to poison damage.', '/races/vellari-emerald.png'),
    ('Vellari', 'Ruby', 'ruby', 'Red fur. Resistance to fire damage.', '/races/vellari-ruby.png'),
    ('Vellari', 'Sapphire', 'sapphire', 'Blue fur. Resistance to cold damage.', '/races/vellari-sapphire.png'),
    ('Lupine', 'Mastiff', 'mastiff', 'A sturdy, heavy-set breed. +1 HP per level.', '/races/lupine.png'),
    ('Lupine', 'Greyhound', 'greyhound', 'A lean, fast breed. +10 ft speed.', '/races/lupine.png'),
    ('Lupine', 'Husky', 'husky', 'A fluffy breed from the cold. Resistance to cold damage.', '/races/lupine.png'),
    ('Lupine', 'Rottweiler', 'rottweiler', 'A powerful breed. Bite: 1d6 + STR as a bonus action, 1 per short rest.', '/races/lupine.png'),
    ('Lupine', 'Shepherd', 'shepherd', 'A watchful herding breed. +2 Insight.', '/races/lupine.png'),
    ('Lupine', 'Bloodhound', 'bloodhound', 'A keen-nosed hound. Track by scent across a trail up to a day old.', '/races/lupine.png')
) AS v(race_name, name, slug, description, img_url) ON v.race_name = r.name
ON CONFLICT (race_id, slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, img_url = EXCLUDED.img_url;
COMMIT;
SELECT r.name AS race, count(*) FROM subraces s JOIN races r ON r.id = s.race_id GROUP BY r.name;