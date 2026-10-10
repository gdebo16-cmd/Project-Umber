// The spell book (learn / unlearn spells) as JSON for React.
import pool from "../db.js";

async function ownsCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows.length > 0;
}

// Everything the sheet and the book need after a change:
// learnedSpells = full rows for the Spell Book tab, learnedIds = just the ids for the book's buttons
async function loadLearned(charId) {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.base_level, cs.is_learned, cs.is_prepared
        FROM character_spells cs
        JOIN spells s ON s.id = cs.spell_id
        WHERE cs.character_id = $1 AND cs.is_learned
        ORDER BY s.base_level, s.name`,
        [charId]
    );
    return { learnedSpells: rows, learnedIds: rows.map((r) => Number(r.id)) };
}

// GET /api/characters/:id/spellbook
export async function getSpellbook(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const { rows: spells } = await pool.query(
        `SELECT id, name, base_level, casting_time, range, duration FROM spells ORDER BY base_level, name`
    );
    res.json({ spells, ...(await loadLearned(charId)) });
}

// POST /api/characters/:id/spells/learn   body: { spell_id }
export async function learnSpell(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    // ON CONFLICT: if the row already exists (your UNIQUE character_id + spell_id), just mark it learned
    await pool.query(
        `INSERT INTO character_spells (character_id, spell_id, is_learned)
        VALUES ($1, $2, true)
        ON CONFLICT (character_id, spell_id) DO UPDATE SET is_learned = true`,
        [charId, Number(req.body.spell_id)]
    );
    res.json(await loadLearned(charId));
}

// POST /api/characters/:id/spells/unlearn   body: { spell_id }
export async function unlearnSpell(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `DELETE FROM character_spells WHERE character_id = $1 AND spell_id = $2`,
        [charId, Number(req.body.spell_id)]
    );
    res.json(await loadLearned(charId));
}
// Shared by prepare / unprepare: flip is_prepared on one learned spell
async function setPrepared(req, res, value) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const { rowCount } = await pool.query(
        `UPDATE character_spells SET is_prepared = $3
        WHERE character_id = $1 AND spell_id = $2 AND is_learned`,
        [charId, Number(req.body.spell_id), value]
    );
    if (!rowCount) return res.status(400).json({ error: 'You have to learn that spell first' });
    res.json(await loadLearned(charId));
}

// POST /api/characters/:id/spells/prepare     body: { spell_id }
export const prepareSpell = (req, res) => setPrepared(req, res, true);

// POST /api/characters/:id/spells/unprepare   body: { spell_id }
export const unprepareSpell = (req, res) => setPrepared(req, res, false);