// Spell catalog from db/content/spells.json (built from source/). In-memory Maps; hot-reloads in non-production.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAlignmentBand } from './content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPELLS_FILE = path.join(__dirname, '..', 'db', 'content', 'spells.json');

let spellsById = new Map();
let upcastsBySpell = new Map();
let elementById = new Map();
let stateById = new Map();
let alignmentById = new Map();
let bandByName = new Map();
let bandByOrd = new Map();
let bonusGrants = [];
let roleSlotRows = [];
let allSpellRows = [];
let liveStateNames = [];

function rebuild(raw) {
    allSpellRows = raw.spells ?? [];
    spellsById = new Map(allSpellRows.map((s) => [Number(s.id), s]));

    upcastsBySpell = new Map();
    for (const u of raw.spell_upcasts ?? []) {
        const id = Number(u.spell_id);
        if (!upcastsBySpell.has(id)) upcastsBySpell.set(id, []);
        upcastsBySpell.get(id).push(u);
    }
    for (const arr of upcastsBySpell.values()) {
        arr.sort((a, b) => Number(a.cast_level) - Number(b.cast_level));
    }

    elementById = new Map((raw.spell_element ?? []).map((r) => [Number(r.id), r]));
    stateById = new Map((raw.spell_state ?? []).map((r) => [Number(r.id), r]));
    alignmentById = new Map((raw.spell_alignment ?? []).map((r) => [Number(r.id), r]));
    bandByName = new Map((raw.spell_bands ?? []).map((r) => [r.name, r]));
    bandByOrd = new Map((raw.spell_bands ?? []).map((r) => [Number(r.ord), r]));
    bonusGrants = raw.role_bonus_spells ?? [];
    roleSlotRows = raw.role_spell_slots ?? [];
    liveStateNames = (raw.spell_state ?? [])
        .filter((s) => !s.retired)
        .map((s) => String(s.name).toLowerCase());
}

export function loadSpellPack() {
    const raw = JSON.parse(fs.readFileSync(SPELLS_FILE, 'utf8'));
    rebuild(raw);
}

loadSpellPack();

if (process.env.NODE_ENV !== 'production') {
    let timer = null;
    try {
        fs.watch(SPELLS_FILE, { persistent: false }, () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    loadSpellPack();
                    console.log('[spellPack] reloaded', SPELLS_FILE);
                } catch (err) {
                    console.error('[spellPack] reload failed:', err.message);
                }
            }, 100);
        });
    } catch (err) {
        console.error('[spellPack] watch failed:', err.message);
    }
}

export function getSpell(id) {
    if (id == null || id === '') return undefined;
    return spellsById.get(Number(id));
}

export function spellName(id) {
    return getSpell(id)?.name ?? null;
}

export function getUpcasts(spellId) {
    return upcastsBySpell.get(Number(spellId)) ?? [];
}

export function getElement(id) {
    if (id == null || id === '') return undefined;
    return elementById.get(Number(id));
}

export function getState(id) {
    if (id == null || id === '') return undefined;
    return stateById.get(Number(id));
}

export function getAlignment(id) {
    if (id == null || id === '') return undefined;
    return alignmentById.get(Number(id));
}

export function getBandByName(name) {
    return bandByName.get(name);
}

export function getBandByOrd(ord) {
    return bandByOrd.get(Number(ord));
}

export function allSpells() {
    return allSpellRows;
}

export function liveStates() {
    return liveStateNames;
}

/** Bonus grants for a role/calling at a level (from pack role_bonus_spells). */
export function getBonusGrants(roleId, callingId, level) {
    const rid = Number(roleId);
    const cid = callingId == null || callingId === '' ? null : Number(callingId);
    const lvl = Number(level) || 1;
    return bonusGrants.filter((b) => {
        if (Number(b.role_id) !== rid) return false;
        if (b.calling_id != null && Number(b.calling_id) !== cid) return false;
        return Number(b.min_level) <= lvl;
    });
}
/** Slot counts for a role (and calling) at a level: [1st, 2nd, ...]. Pack-backed. */
export function getClassSlotsFromPack(roleId, level, callingId = null) {
    const rid = Number(roleId);
    const cid = callingId == null || callingId === '' ? null : Number(callingId);
    const lvl = Number(level) || 1;
    const rows = roleSlotRows.filter(
        (r) => Number(r.role_id) === rid && Number(r.level) <= lvl && (r.calling_id == null || Number(r.calling_id) === cid)
    );
    if (!rows.length) return [];
    const own = rows.some((r) => r.calling_id != null) ? rows.filter((r) => r.calling_id != null) : rows;
    const slots = [];
    for (const r of own.filter((r) => Number(r.level) === lvl)) slots[Number(r.slot_level) - 1] = r.slots;
    return Array.from(slots, (n) => n || 0);
}

function upcastPayload(spellId) {
    return getUpcasts(spellId).map((u) => ({
        cast_level: u.cast_level,
        damage_dice: u.damage_dice,
        heal_dice: u.heal_dice,
        extra_targets: u.extra_targets,
    }));
}

/** Detail row matching the old SQL shape (for sheet / spell book). Orphan id -> null. */
export function enrichSpell(spellOrId, alignmentCode = null) {
    const s = typeof spellOrId === 'object' && spellOrId != null ? spellOrId : getSpell(spellOrId);
    if (!s) return null;
    const st = getState(s.state_id);
    const al = getAlignment(s.alignment_id);
    const el = getElement(s.element_id);
    const chart_band = alignmentCode && al?.chart_square
        ? getAlignmentBand(alignmentCode, al.chart_square)
        : null;
    return {
        id: s.id,
        name: s.name,
        base_level: s.base_level,
        base_damage_dice: s.base_damage_dice,
        opponent_save_roll: s.opponent_save_roll,
        attack_type: s.attack_type,
        base_to_hit_modifier: s.base_to_hit_modifier,
        range: s.range,
        duration: s.duration,
        casting_time: s.casting_time,
        focus_level: s.focus_level,
        description: s.base_description,
        beam_scaling: s.beam_scaling,
        action_type: s.action_type,
        heal_dice: s.heal_dice,
        heal_add_mod: s.heal_add_mod,
        color: s.color,
        state_id: s.state_id,
        element_id: s.element_id,
        alignment_id: s.alignment_id,
        state_name: st?.name ?? null,
        alignment_name: al?.Name ?? al?.name ?? null,
        element_name: el?.name ?? null,
        chart_square: al?.chart_square ?? null,
        upcasts: upcastPayload(s.id),
        chart_band,
    };
}