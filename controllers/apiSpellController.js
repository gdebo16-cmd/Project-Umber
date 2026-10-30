// The spell book (learn / unlearn / prepare / action spells) as JSON for React. Queries live in models/.
import { ownsCharacter } from '../models/characterModel.js';
import * as Spells from '../models/spellModel.js';
import { getSheetCharacter } from '../models/characterModel.js';
import pool from '../db.js';
import { getSpellSlots } from '../client/src/utils/spellSlots.js';
import { getSpellCaps, bodyMaxLevel } from '../utils/spellLimits.js'; /*prep-done*/

// Highest spell level a character can cast (number of slot tiers). Cantrips (0) are always allowed.
// Body Magic has no slots: its highest level comes from the character level.
const highestSlotFor = async (ch) => ch.caster_type === 'body'
    ? bodyMaxLevel(ch.level)
    : getSpellSlots(ch.level, await Spells.getClassSlots(ch.role_id, ch.level, ch.calling_id)).length;

// Everything the sheet and the book need after a change:
// learnedSpells = full rows for the Spell Book tab, learnedIds = just the ids for the book's buttons
// spellLimits = { cantrips, prepared, known } for the counters (null = no cap)
async function loadLearned(charId, ch = null) {
    const rows = await Spells.getLearnedSpells(charId);
    const spellLimits = ch ? getSpellCaps(ch.class_name, ch.level, ch.subclass_name) : undefined;
    return { learnedSpells: rows, learnedIds: rows.map((r) => Number(r.id)), ...(ch ? { spellLimits } : {}) };
}

// Learned / prepared counts, split into cantrips (base_level 0) and leveled spells
async function spellCounts(charId, spellId = null) {
    const { rows: [counts] } = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE s.base_level = 0)::int AS cantrips,
                COUNT(*) FILTER (WHERE s.base_level >= 1)::int AS spells,
                COUNT(*) FILTER (WHERE s.base_level = 0 AND cs.is_prepared)::int AS prepared_cantrips,
                COUNT(*) FILTER (WHERE s.base_level >= 1 AND cs.is_prepared)::int AS prepared_spells,
                COALESCE(BOOL_OR(cs.spell_id = $2), false) AS already,
                COALESCE(BOOL_OR(cs.spell_id = $2 AND cs.is_prepared), false) AS already_prepared
         FROM character_spells cs JOIN spells s ON s.id = cs.spell_id
         WHERE cs.character_id = $1 AND cs.is_learned`,
        [charId, spellId]
    );
    return counts;
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
    const allSpells = await Spells.getSpellsForCharacter(ch.role_id, ch.calling_id, ch.level, ch.alignment_code);
    const highestSlot = await highestSlotFor(ch);
    const spells = allSpells.filter((s) => Number(s.base_level) <= highestSlot);
    res.json({ spells, ...(await loadLearned(charId, ch)) });
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
    // Known caps: cantrips = the cantrip limit, leveled spells = 2x the spells limit (re-learning is never blocked)
    const caps = getSpellCaps(ch.class_name, ch.level, ch.subclass_name);
    if (caps) {
        const counts = await spellCounts(charId, spellId);
        if (!counts.already) {
            if (caps.shared && counts.cantrips + counts.spells >= caps.known) {
                return res.status(400).json({ error: `You already know the most spells you can (${caps.known}) at level ${ch.level}` });
            }
            if (baseLevel === 0 && counts.cantrips >= caps.cantrips) {
                return res.status(400).json({ error: `You already know the most cantrips you can (${caps.cantrips}) at level ${ch.level}` });
            }
            if (baseLevel >= 1 && counts.spells >= caps.known) {
                return res.status(400).json({ error: `You already know the most spells you can (${caps.known}) at level ${ch.level}` });
            }
        }
    }
    await Spells.learnSpell(charId, spellId);
    res.json(await loadLearned(charId, ch));
}

// POST /api/characters/:id/spells/unlearn   body: { spell_id }
export async function unlearnSpell(req, res) {
    const charId = await ownedCharId(req, res);
    if (charId === null) return;
    await Spells.unlearnSpell(charId, Number(req.body.spell_id));
    res.json(await loadLearned(charId, await getSheetCharacter(charId, req.session.userId)));
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
// Prepared cap: leveled spells up to the spells limit, cantrips up to the cantrip limit
export async function prepareSpell(req, res) {
    const charId = await ownedCharId(req, res);
    if (charId === null) return;
    const spellId = Number(req.body.spell_id);
    const ch = await getSheetCharacter(charId, req.session.userId);
    const caps = getSpellCaps(ch.class_name, ch.level, ch.subclass_name);
    if (caps) {
        const counts = await spellCounts(charId, spellId);
        if (!counts.already) return res.status(400).json({ error: 'You have to learn that spell first' });
        const { rows: [spell] } = await pool.query('SELECT base_level FROM spells WHERE id = $1', [spellId]);
        if (!counts.already_prepared) {
            if (caps.shared && counts.prepared_cantrips + counts.prepared_spells >= caps.prepared) {
                return res.status(400).json({ error: `You can prepare ${caps.prepared} spells at level ${ch.level}. Unprepare one first.` });
            }
            if (Number(spell.base_level) === 0 && counts.prepared_cantrips >= caps.cantrips) {
                return res.status(400).json({ error: `You can prepare ${caps.cantrips} cantrips at level ${ch.level}` });
            }
            if (Number(spell.base_level) >= 1 && counts.prepared_spells >= caps.prepared) {
                return res.status(400).json({ error: `You can prepare ${caps.prepared} spells at level ${ch.level}. Unprepare one first.` });
            }
        }
    }
    const rowCount = await Spells.setPrepared(charId, spellId, true);
    if (!rowCount) return res.status(400).json({ error: 'You have to learn that spell first' });
    res.json(await loadLearned(charId, ch));
}

// POST /api/characters/:id/spells/unprepare   body: { spell_id }
export const unprepareSpell = (req, res) => setFlag(req, res, Spells.setPrepared, false);

// POST /api/characters/:id/spells/setAction     body: { spell_id }
export const setAction = (req, res) => setFlag(req, res, Spells.setAction, true);

// POST /api/characters/:id/spells/removeAction     body: { spell_id }
export const removeAction = (req, res) => setFlag(req, res, Spells.setAction, false);
