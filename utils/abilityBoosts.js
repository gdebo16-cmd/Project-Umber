// Ability Boost / Primordial Blessing / Primordial Ascent rules (00-shared-frame §3, rework-2026-10-16/blessings.md).
// Picks live in characters.feature_choices like any other choice; base scores stay in the str..cha columns.
import pool from '../db.js';

export const KEPT_BOOST = 'Kept boost (already in scores)';
export const BOOST_ROWS = ['Ability Boost', 'Primordial Ascent'];
const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// Score cap at a level: 20; 22 from 19; 24 from 22; 26 from 29 (Cap Rise rows)
export function statCap(level) {
    const l = Number(level) || 1;
    return l >= 29 ? 26 : l >= 22 ? 24 : l >= 19 ? 22 : 20;
}

// '+2 STR' -> { stat: 'str', amount: 2 }, anything else -> null
export function parseScorePick(value) {
    const m = /^\+([12]) (STR|DEX|CON|INT|WIS|CHA)$/.exec(String(value ?? ''));
    return m ? { stat: m[2].toLowerCase(), amount: Number(m[1]) } : null;
}

// Blessing picks that raise a score: 'Iron Resolve (+1 STR)', 'Keen Wits (+1 WIS)', 'Second Breath' (always CON).
// Returns { name, stat } (stat may be null) for any blessing pick; name is the primordial_blessings name.
export function parseBlessingPick(value) {
    const v = String(value ?? '');
    const m = /^(.+) \(\+1 (STR|DEX|CON|INT|WIS|CHA)\)$/.exec(v);
    if (m) return { name: m[1], stat: m[2].toLowerCase() };
    if (v === 'Second Breath') return { name: v, stat: 'con' };
    return { name: v, stat: null };
}

// Boost/Ascent rows of a class, oldest first
export async function getBoostRows(classId) {
    const { rows } = await pool.query(
        `SELECT id, level, name FROM class_features WHERE class_id = $1 AND name = ANY($2) ORDER BY level, id`,
        [classId, BOOST_ROWS]
    );
    return rows;
}

// The character's boost picks in level order: [{ key, level, name, value }]
function boostPicks(rows, choices, level) {
    return rows
        .filter((r) => Number(r.level) <= Number(level))
        .map((r) => ({ key: `class:${r.id}`, level: Number(r.level), name: r.name, value: choices?.[`class:${r.id}`]?.[0] }))
        .filter((p) => p.value);
}

// Effective scores: base + score picks, each capped at the character's current cap.
// A base already above the cap is left alone (never lowered).
export function effectiveScores(base, rows, choices, level) {
    const cap = statCap(level);
    const out = Object.fromEntries(STATS.map((s) => [s, Number(base[s]) || 0]));
    for (const p of boostPicks(rows, choices, level)) {
        const sp = parseScorePick(p.value);
        const bp = sp ? null : parseBlessingPick(p.value);
        const stat = sp?.stat ?? bp?.stat;
        const amount = sp?.amount ?? (bp?.stat ? 1 : 0);
        if (stat && amount) out[stat] = Math.max(out[stat], Math.min(cap, out[stat] + amount));
    }
    return out;
}

// Adds base_<stat> and overrides str..cha with effective scores (sheet). Mutates and returns ch.
export async function withEffectiveScores(ch) {
    if (!ch?.class_id) return ch;
    const rows = await getBoostRows(ch.class_id);
    const eff = effectiveScores(ch, rows, ch.feature_choices ?? {}, ch.level);
    for (const s of STATS) { ch[`base_${s}`] = ch[s]; ch[s] = eff[s]; }
    ch.stat_cap = statCap(ch.level);
    return ch;
}

// Does the class/subclass meet one prerequisite clause? scores may be null (character creation, before rolls).
async function meetsClause(clause, ctx, pickLevel, scores) {
    const c = clause.toLowerCase().trim();
    if (!c || c === 'none') return true;
    if (c.includes(' or level ')) {
        const [a, b] = c.split(' or level ');
        return (await meetsClause(a, ctx, pickLevel, scores)) || pickLevel >= Number(b);
    }
    let m = /^level (\d+)$/.exec(c);
    if (m) return pickLevel >= Number(m[1]);
    m = /^(str|dex|con|int|wis|cha)(?: or (str|dex|con|int|wis|cha))? (\d+)$/.exec(c);
    if (m) {
        if (!scores) return true; // scores aren't rolled yet at creation step 2
        return [m[1], m[2]].filter(Boolean).some((s) => scores[s] >= Number(m[3]));
    }
    if (c.includes('spellcasting')) return ctx.caster;
    if (c.includes('extra attack')) return ctx.extraAttackLevel != null && ctx.extraAttackLevel <= pickLevel;
    if (c.includes('armor') || c.includes('shield')) return /medium|heavy|shield/i.test(ctx.armor);
    if (c.includes('ranged weapon')) return /simple|martial|bow|crossbow|sling|dart/i.test(ctx.weapons);
    if (c.includes('weapon')) return /simple|martial|weapon/i.test(ctx.weapons);
    return true; // unknown wording: not blocked
}

// Server rules for boost-row picks. choices = the full feature_choices being saved, prev = what was saved.
// Returns { error } or { refund, usedRepick } (refund = stat to lower by 2 when a kept boost is re-picked).
export async function checkBoostRules({ classId, subclassId, level, base, choices, prev = {}, repickAvailable = false, refundAbility = null }) {
    const rows = await getBoostRows(classId);
    const picks = boostPicks(rows, choices, level);
    if (!picks.length && !Object.values(prev ?? {}).flat().includes(KEPT_BOOST)) return {};

    // kept boosts: only from the migration; changing one uses the single free re-pick
    let usedRepick = false;
    for (const r of rows) {
        const key = `class:${r.id}`;
        const was = prev?.[key]?.[0];
        const now = choices?.[key]?.[0];
        if (now === KEPT_BOOST && was !== KEPT_BOOST) return { error: `${KEPT_BOOST} can't be picked; choose a boost or a blessing` };
        if (was === KEPT_BOOST && now !== KEPT_BOOST) {
            if (!repickAvailable || usedRepick) return { error: 'You already used your free re-pick of a kept boost' };
            usedRepick = true;
        }
    }
    let refund = null;
    if (usedRepick && refundAbility != null) {
        const s = String(refundAbility).toLowerCase();
        if (!STATS.includes(s)) return { error: 'refund_ability must be one of str, dex, con, int, wis, cha' };
        refund = s;
    }

    // class info for prerequisites
    const { rows: [info] } = await pool.query(
        `SELECT COALESCE(NULLIF(s.caster_type, ''), NULLIF(c.caster_type, ''), 'none') <> 'none' AS caster,
                concat_ws(', ', c.armor_proficiencies, s.armor_proficiencies) AS armor,
                concat_ws(', ', c.weapon_proficiencies, s.weapon_proficiencies) AS weapons,
                (SELECT MIN(level) FROM class_features WHERE class_id = c.id AND name LIKE 'Extra Attack%') AS extra_attack_level
           FROM classes c LEFT JOIN sub_classes s ON s.id = $2 AND s.class_id = c.id WHERE c.id = $1`,
        [classId, subclassId]
    );
    const ctx = { caster: !!info?.caster, armor: info?.armor ?? '', weapons: info?.weapons ?? '', extraAttackLevel: info?.extra_attack_level };
    const { rows: blessings } = await pool.query(`SELECT name, prerequisite, repeatable_max FROM primordial_blessings`);
    const byName = new Map(blessings.map((b) => [b.name, b]));

    // walk the picks in level order: caps, prerequisites (with the scores at that point), repeat limits
    const cap = statCap(level);
    const scores = base ? Object.fromEntries(STATS.map((s) => [s, Number(base[s]) - (s === refund ? 2 : 0)])) : null;
    const taken = new Map();
    for (const p of picks) {
        const sp = parseScorePick(p.value);
        if (sp) {
            if ((p.name === 'Primordial Ascent') !== (sp.amount === 1)) return { error: `${p.value} isn't an option for ${p.name}` };
            if (scores) {
                if (scores[sp.stat] >= cap) return { error: `${sp.stat.toUpperCase()} is already at your cap of ${cap}; pick another score or a blessing` };
                scores[sp.stat] = Math.min(cap, scores[sp.stat] + sp.amount);
            }
            continue;
        }
        const bp = parseBlessingPick(p.value);
        const b = byName.get(bp.name);
        if (!b) continue; // kept boost
        const n = (taken.get(b.name) ?? 0) + 1;
        if (n > b.repeatable_max) return { error: b.repeatable_max === 1 ? `${b.name} can only be taken once` : `${b.name} can be taken at most ${b.repeatable_max} times` };
        taken.set(b.name, n);
        for (const clause of String(b.prerequisite ?? '').split(/,\s*/)) {
            if (!(await meetsClause(clause, ctx, p.level, scores))) {
                return { error: `${b.name} needs: ${b.prerequisite} (picked at level ${p.level})` };
            }
        }
        // its +1: Iron Resolve / Keen Wits name a score, so a capped score must be swapped for another;
        // Second Breath is always CON, and its +1 is simply lost at the cap (blessings.md stat cap rule)
        if (bp.stat && scores) {
            if (scores[bp.stat] >= cap && bp.name !== 'Second Breath') {
                return { error: `${bp.stat.toUpperCase()} is already at your cap of ${cap}; pick ${b.name} with another score` };
            }
            scores[bp.stat] = Math.min(cap, scores[bp.stat] + 1);
        }
    }
    return { refund, usedRepick };
}

// Short descriptions for the dropdowns: { optionName: description }
export function scorePickDescriptions() {
    const out = {};
    for (const s of STATS) {
        out[`+2 ${s.toUpperCase()}`] = `Raise ${s.toUpperCase()} by 2 (never above your cap).`;
        out[`+1 ${s.toUpperCase()}`] = `Raise ${s.toUpperCase()} by 1 (never above your cap of 26).`;
    }
    out[KEPT_BOOST] = 'A boost you took before the 2026-10-16 rework. It is already counted in your scores. You can re-pick one kept boost for free.';
    return out;
}
