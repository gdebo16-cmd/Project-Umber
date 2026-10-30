// Spell reads use the JSON pack (models/spellPack.js). character_spells stays in the DB (ids + flags only).
import pool from '../db.js';
import content from './content.js';
import {
    getSpell,
    enrichSpell,
    allSpells,
    getBonusGrants,
    getClassSlotsFromPack,
} from './spellPack.js';

// Feature-only spells: granted by class features, never learnable from the book.
// Single source of truth - used by getLearnableSpells and learnSpell reject.
export const FEATURE_ONLY_SPELL_NAMES = Object.freeze(['Grace Bolt', 'Soul Link']);

export function isFeatureOnlySpell(name) {
    return FEATURE_ONLY_SPELL_NAMES.some((n) => n.toLowerCase() === String(name ?? '').trim().toLowerCase());
}

function sortSpellRows(rows) {
    return rows.sort((a, b) => Number(a.base_level) - Number(b.base_level) || String(a.name).localeCompare(String(b.name)));
}

// Every learned spell for a character, with the details the sheet, Spell Book and details box need.
// Orphan spell_ids (not in the pack) are skipped, not errors.
export async function getLearnedSpells(charId) {
    const { rows: [ch] } = await pool.query(
        `SELECT c.id, c.role_id, c.calling_id, c.level, c.alignment_code, c.race_id, c.species_id, c.race_spell_id
         FROM characters c
         WHERE c.id = $1`,
        [charId]
    );
    if (!ch) return [];

    const { rows: learned } = await pool.query(
        `SELECT spell_id, is_learned, is_prepared, is_action
         FROM character_spells
         WHERE character_id = $1 AND is_learned`,
        [charId]
    );

    const seen = new Set();
    const out = [];

    for (const row of learned) {
        const detail = enrichSpell(row.spell_id, ch.alignment_code);
        if (!detail) continue; // orphan: hide
        seen.add(Number(detail.id));
        out.push({
            ...detail,
            is_learned: row.is_learned,
            is_prepared: row.is_prepared,
            is_action: row.is_action,
            is_racial: false,
            is_bonus: false,
        });
    }

    // Race starter: always known and prepared (not a character_spells row)
    const species = (content.species ?? []).find((s) => Number(s.id) === Number(ch.species_id));
    const raceSpellId = ch.race_spell_id ?? species?.race_spell_id ?? null;
    if (raceSpellId != null && !seen.has(Number(raceSpellId))) {
        const detail = enrichSpell(raceSpellId, ch.alignment_code);
        if (detail) {
            seen.add(Number(detail.id));
            out.push({
                ...detail,
                is_learned: true,
                is_prepared: true,
                is_action: false,
                is_racial: true,
                is_bonus: false,
            });
        }
    }

    // Role/calling bonus grants from pack (e.g. Soul Link)
    for (const g of getBonusGrants(ch.role_id, ch.calling_id, ch.level)) {
        const sid = Number(g.spell_id);
        if (seen.has(sid)) continue;
        const detail = enrichSpell(sid, ch.alignment_code);
        if (!detail) continue;
        seen.add(sid);
        out.push({
            ...detail,
            is_learned: true,
            is_prepared: true,
            is_action: false,
            is_racial: false,
            is_bonus: true,
        });
    }

    return sortSpellRows(out);
}

// Every spell (Spell Book list), with the same detail fields + names as getLearnedSpells
export async function getAllSpells() {
    return sortSpellRows(allSpells().map((s) => enrichSpell(s)).filter(Boolean));
}

// Spell Book learn catalog: every spell except the feature-only denylist.
// alignmentCode (optional): adds chart_band for the character's colour square.
export async function getLearnableSpells(alignmentCode = null) {
    const deny = new Set(FEATURE_ONLY_SPELL_NAMES.map((n) => n.toLowerCase()));
    return sortSpellRows(
        allSpells()
            .filter((s) => !deny.has(String(s.name ?? '').trim().toLowerCase()))
            .map((s) => enrichSpell(s, alignmentCode))
            .filter(Boolean)
    );
}

// Legacy role_spells list (still used rarely): ids from DB, details from pack. Bonus grants excluded.
export async function getSpellsForCharacter(roleId, callingId, level, alignmentCode = null) {
    const { rows } = await pool.query(
        `SELECT spell_id, MIN(min_level) AS unlock_level
         FROM role_spells
         WHERE role_id = $1 AND (calling_id IS NULL OR calling_id = $2) AND min_level <= $3
           AND NOT EXISTS (
             SELECT 1 FROM role_spells b
             WHERE b.is_bonus AND b.spell_id = role_spells.spell_id
               AND b.role_id = $1 AND (b.calling_id IS NULL OR b.calling_id = $2)
           )
         GROUP BY spell_id`,
        [roleId, callingId, level]
    );
    const out = [];
    for (const r of rows) {
        const detail = enrichSpell(r.spell_id, alignmentCode);
        if (!detail) continue;
        out.push({ ...detail, unlock_level: r.unlock_level });
    }
    return sortSpellRows(out);
}

// Slot counts for a role (and calling) at a level from pack role_spell_slots: [1st, 2nd, ...].
export async function getClassSlots(roleId, level, callingId = null) {
    return getClassSlotsFromPack(roleId, level, callingId);
}

// ---------- spell writes (character_spells only) ----------

export async function learnSpell(charId, spellId) {
    await pool.query(
        `INSERT INTO character_spells (character_id, spell_id, is_learned)
        VALUES ($1, $2, true)
        ON CONFLICT (character_id, spell_id) DO UPDATE SET is_learned = true`,
        [charId, spellId]
    );
}

export async function unlearnSpell(charId, spellId) {
    await pool.query(
        `DELETE FROM character_spells WHERE character_id = $1 AND spell_id = $2`,
        [charId, spellId]
    );
}

export async function setPrepared(charId, spellId, value) {
    const { rowCount } = await pool.query(
        `UPDATE character_spells SET is_prepared = $3
        WHERE character_id = $1 AND spell_id = $2 AND is_learned`,
        [charId, spellId, value]
    );
    return rowCount;
}

export async function setAction(charId, spellId, value) {
    const { rowCount } = await pool.query(
        `UPDATE character_spells SET is_action = $3
        WHERE character_id = $1 AND spell_id = $2 AND is_learned`,
        [charId, spellId, value]
    );
    return rowCount;
}

/** Counts learned/prepared by base_level from pack (orphans ignored). */
export async function spellCountsFromPack(charId, spellId = null) {
    const { rows } = await pool.query(
        `SELECT spell_id, is_prepared FROM character_spells
         WHERE character_id = $1 AND is_learned`,
        [charId]
    );
    let cantrips = 0;
    let spells = 0;
    let prepared_cantrips = 0;
    let prepared_spells = 0;
    let already = false;
    let already_prepared = false;
    const want = spellId == null ? null : Number(spellId);
    for (const row of rows) {
        const sid = Number(row.spell_id);
        if (want != null && sid === want) {
            already = true;
            already_prepared = !!row.is_prepared;
        }
        const s = getSpell(sid);
        if (!s) continue;
        const lvl = Number(s.base_level);
        if (lvl === 0) {
            cantrips += 1;
            if (row.is_prepared) prepared_cantrips += 1;
        } else {
            spells += 1;
            if (row.is_prepared) prepared_spells += 1;
        }
    }
    return { cantrips, spells, prepared_cantrips, prepared_spells, already, already_prepared };
}