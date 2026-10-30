// Divine Blessing (pack) + Primordial Blessing rules (00-shared-frame §3, rework-2026-10-16/blessings.md).
// Picks live in characters.feature_choices like any other choice; base scores stay in the str..cha columns.
// Pack schedule is Divine Blessing at 4/6/10/12/16/18 — no Primordial Ascent in the pack.
import content, { primordialBlessingsFromPack, roleProficiencyContext, boostRowsForRole, getRole } from '../models/content.js';
import { roleIdForLegacyClass } from '../models/idMap.js';

export const KEPT_BOOST = 'Kept boost (already in scores)';
export const BOOST_ROWS = ['Divine Blessing'];
const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function rowKey(r) {
    return r.key || (String(r.id).includes(':') ? String(r.id) : `class:${r.id}`);
}

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

// Pack Divine Blessing rows for a role id, or for a legacy class id (mapped via idMap).
export async function getBoostRows(classOrRoleId) {
    if (classOrRoleId == null || classOrRoleId === '') return [];
    let role = getRole(classOrRoleId);
    if (!role) {
        const roleId = await roleIdForLegacyClass(classOrRoleId);
        if (roleId != null) role = getRole(roleId);
    }
    return role ? boostRowsForRole(role.id) : [];
}

// The character's boost picks in level order: [{ key, level, name, value }]
function boostPicks(rows, choices, level) {
    return rows
        .filter((r) => Number(r.level) <= Number(level))
        .map((r) => {
            const key = rowKey(r);
            return { key, level: Number(r.level), name: r.name, value: choices?.[key]?.[0] };
        })
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
    if (!ch) return ch;
    const id = ch.role_id ?? ch.class_id;
    if (id == null) return ch;
    const rows = await getBoostRows(id);
    const eff = effectiveScores(ch, rows, ch.feature_choices ?? {}, ch.level);
    for (const s of STATS) { ch[`base_${s}`] = ch[s]; ch[s] = eff[s]; }
    ch.stat_cap = statCap(ch.level);
    return ch;
}

// Does the class/subclass meet one prerequisite clause? scores may be null (character creation, before rolls).
function meetsClause(clause, ctx, pickLevel, scores) {
    const c = clause.toLowerCase().trim();
    if (!c || c === 'none') return true;
    if (c.includes(' or level ')) {
        const [a, b] = c.split(' or level ');
        return meetsClause(a, ctx, pickLevel, scores) || pickLevel >= Number(b);
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
    // weapons = the class + subclass weapon categories (see weapon_category)
    if (c.includes('ranged weapon')) return /ranged/i.test(ctx.weapons);
    if (c.includes('heavy or versatile')) return /versatile|great|reach|ranged two-handed/i.test(ctx.weapons);
    if (c.includes('weapon')) return ctx.weapons.trim() !== '';
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
        const key = rowKey(r);
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

    const { ctx, byName } = await loadPrereqContext(classId, subclassId);
    const scores = base ? Object.fromEntries(STATS.map((s) => [s, Number(base[s]) - (s === refund ? 2 : 0)])) : null;
    const error = walkPicks(picks, { ctx, byName, cap: statCap(level), scores });
    return error ? { error } : { refund, usedRepick };
}

// Class/subclass info for blessing prerequisites, and the blessings by name
async function loadPrereqContext(classId, subclassId) {
    // Extra Attack level from pack role_features; armor/weapons/caster + blessings from pack.
    const roleId = await roleIdForLegacyClass(classId);
    let extraAttackLevel = null;
    if (roleId) {
        const levels = (content.role_features ?? [])
            .filter((rf) => Number(rf.role_id) === Number(roleId) && String(rf.name || '').startsWith('Extra Attack'))
            .map((rf) => Number(rf.level))
            .filter((n) => Number.isFinite(n));
        if (levels.length) extraAttackLevel = Math.min(...levels);
    }
    // subclassId here is legacy; calling id is not always available — pack role profs cover base prereqs
    const packCtx = roleId ? roleProficiencyContext(roleId, null) : { armor: '', weapons: '', caster: false };
    const ctx = {
        caster: !!packCtx.caster,
        armor: packCtx.armor ?? '',
        weapons: packCtx.weapons ?? '',
        extraAttackLevel,
    };
    const blessings = primordialBlessingsFromPack();
    const byName = new Map(blessings.map((b) => [b.name, b]));
    return { ctx, byName };
}

// Walk boost picks in level order: caps, prerequisites (with the scores at that point), repeat limits.
// scores (copied, may be null) = base scores. Returns an error message or null.
// Divine Blessing uses +2 score picks (same as legacy Ability Boost). Pack has no Primordial Ascent (+1).
function walkPicks(picks, { ctx, byName, cap, scores: base, taken = new Map() }) {
    const scores = base ? { ...base } : null;
    for (const p of picks) {
        const sp = parseScorePick(p.value);
        if (sp) {
            if ((p.name === 'Primordial Ascent') !== (sp.amount === 1)) return `${p.value} isn't an option for ${p.name}`;
            if (scores) {
                if (scores[sp.stat] >= cap) return `${sp.stat.toUpperCase()} is already at your cap of ${cap}; pick another score or a blessing`;
                scores[sp.stat] = Math.min(cap, scores[sp.stat] + sp.amount);
            }
            continue;
        }
        const bp = parseBlessingPick(p.value);
        const b = byName.get(bp.name);
        if (!b) continue; // kept boost
        const n = (taken.get(b.name) ?? 0) + 1;
        if (n > b.repeatable_max) return b.repeatable_max === 1 ? `${b.name} can only be taken once` : `${b.name} can be taken at most ${b.repeatable_max} times`;
        taken.set(b.name, n);
        for (const clause of String(b.prerequisite ?? '').split(/,\s*/)) {
            if (!meetsClause(clause, ctx, p.level, scores)) {
                return `${b.name} needs: ${b.prerequisite} (picked at level ${p.level})`;
            }
        }
        // its +1: Iron Resolve / Keen Wits name a score, so a capped score must be swapped for another;
        // Second Breath is always CON, and its +1 is simply lost at the cap (blessings.md stat cap rule)
        if (bp.stat && scores) {
            if (scores[bp.stat] >= cap && bp.name !== 'Second Breath') {
                return `${bp.stat.toUpperCase()} is already at your cap of ${cap}; pick ${b.name} with another score`;
            }
            scores[bp.stat] = Math.min(cap, scores[bp.stat] + 1);
        }
    }
    return null;
}

// Which options each boost row may show, for the creator/editor dropdowns (the save still runs checkBoostRules).
// Rows are walked in level order with the same rules as a save: an option is allowed when the picks kept so far
// plus that option pass walkPicks, and it doesn't push a blessing past its repeat limit counting the later rows.
// A current pick that is no longer allowed is dropped (not counted for later rows), so the client clears it.
// Returns { [feature key]: [allowed options] }.
export async function allowedBoostOptions({ classId, subclassId, level, base, choices }) {
    const rows = (await getBoostRows(classId)).filter((r) => Number(r.level) <= Number(level));
    if (!rows.length) return {};
    const { ctx, byName } = await loadPrereqContext(classId, subclassId);
    const cap = statCap(level);
    const scores = base && STATS.every((s) => Number.isFinite(Number(base[s])))
        ? Object.fromEntries(STATS.map((s) => [s, Number(base[s])])) : null;
    const blessingOf = (v) => (parseScorePick(v) ? null : byName.get(parseBlessingPick(v).name)?.name);
    const kept = [];
    const out = {};
    rows.forEach((r, i) => {
        const key = rowKey(r);
        const current = choices?.[key]?.[0];
        // blessings picked on later rows count toward the repeat limit too
        const later = new Map();
        for (const lr of rows.slice(i + 1)) {
            const name = blessingOf(choices?.[rowKey(lr)]?.[0]);
            if (name) later.set(name, (later.get(name) ?? 0) + 1);
        }
        out[key] = (r.options ?? []).filter((o) => {
            if (o === KEPT_BOOST) return current === KEPT_BOOST;
            const name = blessingOf(o);
            if (name && later.get(name) >= byName.get(name).repeatable_max) return false;
            const candidate = [...kept, { key, level: Number(r.level), name: r.name, value: o }];
            return !walkPicks(candidate, { ctx, byName, cap, scores });
        });
        if (current && out[key].includes(current)) kept.push({ key, level: Number(r.level), name: r.name, value: current });
    });
    return out;
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
