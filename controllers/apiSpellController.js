// The spell book (learn / unlearn / prepare / action spells) as JSON for React. Queries live in models/.
import { ownsCharacter } from '../models/characterModel.js';
import * as Spells from '../models/spellModel.js';
import { getSheetCharacter } from '../models/characterModel.js';
import pool from '../db.js';
import { getSpellSlots } from '../client/src/utils/spellSlots.js';
import { getLearnLimits } from '../utils/spellLimits.js';

// Highest spell level a character can cast (number of slot tiers). Cantrips (0) are always allowed.
const highestSlotFor = async (ch) => getSpellSlots(ch.level, await Spells.getClassSlots(ch.class_id, ch.level, ch.subclass_id)).length;

// Everything the sheet and the book need after a change:
// learnedSpells = full rows for the Spell Book tab, learnedIds = just the ids for the book's buttons
async function loadLearned(charId) {
    const rows = await Spells.getLearnedSpells(charId);
    return { learnedSpells: rows, learnedIds: rows.map((r) => Number(r.id)) };
}

// Ownership check shared by every route. Returns charId, or null after sending 401/404.
async function ownedCharId(req, res) {
    if (!req.session.userId) { res.status(401).json({ error: 'Not logged in' }); return null; }
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        res.status(404).json({ error: 'Character not found' });
        return null;
    }
    return charId;
}

// GET /api/characters/:id/spellbook
export async function getSpellbook(req, res) {
    const charId = await ownedCharId(req, res);
    if (charId === null) return;
    const ch = await getSheetCharacter(charId, req.session.userId);
    const allSpells = await Spells.getSpellsForCharacter(ch.class_id, ch.subclass_id, ch.level);
    const highestSlot = await highestSlotFor(ch);
    const spells = allSpells.filter((s) => Number(s.base_level) <= highestSlot);
    res.json({ spells, ...(await loadLearned(charId)) });
}

// POST /api/characters/:id/spells/learn   body: { spell_id }
export async function learnSpell(req, res) {
    const charId = await ownedCharId(req, res);
    if (charId === null) return;
    const spellId = Number(req.body.spell_id);
    const ch = await getSheetCharacter(charId, req.session.userId);
    const { rows: [spell] } = await pool.query('SELECT base_level FROM spells WHERE id = $1', [spellId]);
    if (!spell) return res.status(400).json({ error: 'That spell does not exist' });
    const baseLevel = Number(spell.base_level);
    const highestSlot = await highestSlotFor(ch);
    if (baseLevel > highestSlot) {
        return res.status(400).json({ error: `You can't learn level ${baseLevel} spells yet. At level ${ch.level} you can cast up to level ${highestSlot}.` });
    }
    // Known caps (re-learning a spell you already know is never blocked)
    const limits = getLearnLimits(ch.class_name, ch.level, ch.subclass_name);
    if (limits) {
        const { rows: [counts] } = await pool.query(
            `SELECT COUNT(*) FILTER (WHERE s.base_level = 0)::int AS cantrips,
                    COUNT(*) FILTER (WHERE s.base_level >= 1)::int AS spells,
                    BOOL_OR(cs.spell_id = $2) AS already
             FROM character_spells cs JOIN spells s ON s.id = cs.spell_id
             WHERE cs.character_id = $1 AND cs.is_learned`,
            [charId, spellId]
        );
        if (!counts.already) {
            if (baseLevel === 0 && counts.cantrips >= limits.cantrips) {
                return res.status(400).json({ error: `You already know the most cantrips you can (${limits.cantrips}) at level ${ch.level}` });
            }
            if (baseLevel >= 1 && counts.spells >= limits.spells) {
                return res.status(400).json({ error: `You already know the most spells you can (${limits.spells}) at level ${ch.level}` });
            }
        }
    }
    await Spells.learnSpell(charId, spellId);
    res.json(await loadLearned(charId));
}

// POST /api/characters/:id/spells/unlearn   body: { spell_id }
export async function unlearnSpell(req, res) {
    const charId = await ownedCharId(req, res);
    if (charId === null) return;
    await Spells.unlearnSpell(charId, Number(req.body.spell_id));
    res.json(await loadLearned(charId));
}

// Shared by prepare / unprepare / setAction / removeAction: flip one flag on a learned spell
async function setFlag(req, res, setter, value) {
    const charId = await ownedCharId(req, res);
    if (charId === null) return;
    const rowCount = await setter(charId, Number(req.body.spell_id), value);
    if (!rowCount) return res.status(400).json({ error: 'You have to learn that spell first' });
    res.json(await loadLearned(charId));
}

// POST /api/characters/:id/spells/prepare     body: { spell_id }
export const prepareSpell = (req, res) => setFlag(req, res, Spells.setPrepared, true);

// POST /api/characters/:id/spells/unprepare   body: { spell_id }
export const unprepareSpell = (req, res) => setFlag(req, res, Spells.setPrepared, false);

// POST /api/characters/:id/spells/setAction     body: { spell_id }
export const setAction = (req, res) => setFlag(req, res, Spells.setAction, true);

// POST /api/characters/:id/spells/removeAction     body: { spell_id }
export const removeAction = (req, res) => setFlag(req, res, Spells.setAction, false);
