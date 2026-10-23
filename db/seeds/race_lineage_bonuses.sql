-- race_lineage_bonuses: one row per lineage bonus (skill boost or unique trait). Safe to re-run.
CREATE TABLE IF NOT EXISTS race_lineage_bonuses (
    id           SERIAL PRIMARY KEY,
    race_id      INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT,
    skill        TEXT,        -- skill it boosts, e.g. 'Stealth' (NULL if not a skill bonus)
    bonus        INTEGER,     -- amount added to that skill, e.g. 2
    level        INTEGER NOT NULL DEFAULT 1,  -- character level it unlocks at
    action_type  TEXT CHECK (action_type IN ('action', 'bonus', 'reaction')),  -- NULL = not usable in Actions
    uses         TEXT,        -- e.g. 'At will', '1 per long rest'
    dice         TEXT,        -- e.g. '1d6'
    UNIQUE (race_id, name)
);
