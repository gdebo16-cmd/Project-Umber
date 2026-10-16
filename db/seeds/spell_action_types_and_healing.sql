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
UPDATE spells SET action_type = 'bonus' WHERE name IN (
    'Branding Smite', 'Divine Favor', 'Expeditious Retreat', 'Flame Blade', 'Healing Word',
    'Hunter''s Mark', 'Magic Weapon', 'Mass Healing Word', 'Misty Step', 'Sanctuary',
    'Shield of Faith', 'Shillelagh', 'Spiritual Weapon');

-- SRD: 1 reaction
UPDATE spells SET action_type = 'reaction' WHERE name IN ('Counterspell', 'Feather Fall', 'Hellish Rebuke', 'Shield');

-- Healing dice at the spell's base level (spell_upcasts.heal_dice already holds the upcast totals)
UPDATE spells SET heal_dice = NULL, heal_add_mod = FALSE;
UPDATE spells s SET heal_dice = v.dice, heal_add_mod = v.add_mod
FROM (VALUES
    ('Cure Wounds',       '1d8',     TRUE),
    ('Healing Word',      '1d4',     TRUE),
    ('Mass Cure Wounds',  '3d8',     TRUE),
    ('Mass Healing Word', '1d4',     TRUE),
    ('Prayer of Healing', '2d8',     TRUE),
    ('Heal',              '70',      FALSE),
    ('Mass Heal',         '700',     FALSE),
    ('Regenerate',        '4d8+15',  FALSE),
    ('Goodberry',         '1',       FALSE),
    ('Aid',               '5',       FALSE),
    ('False Life',        '1d4+4',   FALSE),
    ('Heroes'' Feast',    '2d10',    FALSE)
) AS v(name, dice, add_mod)
WHERE s.name = v.name;