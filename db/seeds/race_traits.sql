-- race_traits: one row per race with its core stats. Safe to re-run.
CREATE TABLE IF NOT EXISTS race_traits (
    id            SERIAL PRIMARY KEY,
    race_id       INTEGER NOT NULL UNIQUE REFERENCES races(id) ON DELETE CASCADE,
    creature_type TEXT,
    size          TEXT,
    base_speed    INTEGER,
    resistances   TEXT,
    dark_vision   BOOLEAN DEFAULT false
);

INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT id, creature_type, size, base_speed, resistances, darkvision FROM races
ON CONFLICT (race_id) DO NOTHING;

-- lineage bonuses live in race_lineage_bonuses now
ALTER TABLE race_traits DROP COLUMN IF EXISTS lineage_bonus;
