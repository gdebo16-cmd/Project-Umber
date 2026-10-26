-- Spell action types (Actions tab tiles) and healing dice. Idempotent: safe to re-run.
-- spells.casting_time is stored as turns (1 = action/bonus/reaction, NULL = 1 minute or longer),
-- so bonus actions and reactions come from the SRD casting times by name.

ALTER TABLE spells ADD COLUMN IF NOT EXISTS action_type  TEXT;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS heal_dice    TEXT;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS heal_add_mod BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'spells_action_type_check') THEN
        ALTER TABLE spells ADD CONSTRAINT spells_action_type_check CHECK (action_type IN ('action', 'bonus', 'reaction', 'other'));
    END IF;
END $$;

-- Default from casting_time: in-combat casts are actions, longer casts are 'other'
UPDATE spells SET action_type = CASE WHEN casting_time IS NULL THEN 'other' ELSE 'action' END;

-- SRD: 1 bonus action
UPDATE spells SET action_type = 'bonus' WHERE id IN (150 /* Searing Brand */, 203 /* Zealous Strike */, 217 /* Swiftfoot */, 235 /* Fire Sword */, 269 /* Kind Word */, 278 /* Prey Brand */, 307 /* Rune Edge */, 312 /* Rallying Hymn */, 323 /* Mist Hop */, 365 /* Hallowed Refuge */, 376 /* Faithguard */, 377 /* Oakheart Cudgel */, 392 /* Spectral Blade */);

-- SRD: 1 reaction
UPDATE spells SET action_type = 'reaction' WHERE id IN (180 /* Spellbreak */, 224 /* Downy Descent */, 271 /* Infernal Retort */, 375 /* Force Aegis */);

-- Healing dice at the spell's base level (spell_upcasts.heal_dice already holds the upcast totals)
UPDATE spells SET heal_dice = NULL, heal_add_mod = FALSE;
UPDATE spells s SET heal_dice = v.dice, heal_add_mod = v.add_mod
FROM (VALUES
    (185 /* Warm Hands */,       '1d8',     TRUE),
    (269 /* Kind Word */,      '1d4',     TRUE),
    (310 /* Tide of Mending */,  '3d8',     TRUE),
    (312 /* Rallying Hymn */, '1d4',     TRUE),
    (340 /* Fireside Chant */, '2d8',     TRUE),
    (268 /* Lifebloom */,              '70',      FALSE),
    (311 /* Great Mending */,         '700',     FALSE),
    (355 /* Regrowth */,        '4d8+15',  FALSE),
    (255 /* Hearthberries */,         '1',       FALSE),
    (119 /* Rallying Light */,               '5',       FALSE),
    (222 /* Deathless Vigor */,        '1d4+4',   FALSE),
    (272 /* Grand Feast */,    '2d10',    FALSE)
) AS v(id, dice, add_mod)
WHERE s.id = v.id;