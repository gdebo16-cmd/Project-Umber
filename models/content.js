import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'db', 'content', 'content.json');

// Read once when the server starts
const content = JSON.parse(fs.readFileSync(file, 'utf8'));

export const SUBCLASS_LEVEL = 3;

export function getRole(roleId) {
    if (roleId == null) return undefined;
    const id = Number(roleId);
    return (content.roles ?? []).find((r) => Number(r.id) === id);
}

export function getCalling(role, callingId) {
    if (!role || callingId == null || callingId === '') return undefined;
    const id = Number(callingId);
    return (role.callings ?? []).find((c) => Number(c.id) === id);
}


// Display names (pack primary_stat) and short codes (pack spell_stat / DB) -> characters table key
const STAT_TO_KEY = {
    might: 'str', str: 'str',
    precision: 'dex', dex: 'dex',
    endurance: 'con', con: 'con',
    intellect: 'int', int: 'int',
    judgment: 'wis', wis: 'wis',
    confidence: 'cha', cha: 'cha',
    speed: 'spd', spd: 'spd',
    luck: 'luc', luc: 'luc',
};

/** 'Might' / 'STR' / 'str' -> 'str' (unknown -> undefined) */
export function scoreKey(stat) {
    if (stat == null || stat === '') return undefined;
    return STAT_TO_KEY[String(stat).trim().toLowerCase()];
}

// Stable feature_choices key (scheme A)
export function choiceKey(source, ownerKey, featureName, level) {
    return `${source}:${ownerKey}:${featureName}:${level}`;
}

function roleChoiceRows(role) {
    if (!role?.key) return [];
    const out = [];
    for (const lvl of role.levels ?? []) {
        for (const f of lvl.features ?? []) {
            if (!Array.isArray(f.options) || f.options.length === 0) continue;
            if (f.data?.choice_timing && f.data.choice_timing !== 'create') continue;
            // Top-level options are only hoisted for create-time features by build.ts
            out.push({
                source: 'class',
                ownerKey: role.key,
                id: choiceKey('class', role.key, f.name, lvl.level),
                key: choiceKey('class', role.key, f.name, lvl.level),
                name: f.name,
                level: Number(lvl.level),
                options: f.options,
                choice_count: f.choice_count ?? 1,
                option_info: f.option_info ?? {},
                description: f.description ?? '',
            });
        }
    }
    return out;
}

function callingChoiceRows(calling) {
    if (!calling?.key) return [];
    const out = [];
    for (const f of calling.features ?? []) {
        if (!Array.isArray(f.options) || f.options.length === 0) continue;
        if (f.data?.choice_timing && f.data.choice_timing !== 'create') continue;
        out.push({
            source: 'subclass',
            ownerKey: calling.key,
            id: choiceKey('subclass', calling.key, f.name, f.level),
            key: choiceKey('subclass', calling.key, f.name, f.level),
            name: f.name,
            level: Number(f.level),
            options: f.options,
            choice_count: f.choice_count ?? 1,
            option_info: f.option_info ?? {},
            description: f.description ?? '',
        });
    }
    return out;
}

// Create-time choice features for a role (+ calling from SUBCLASS_LEVEL up), unlocked at level
export function choiceFeaturesForRole(roleId, callingId, level) {
    const role = getRole(roleId);
    if (!role) return [];
    const lvl = Number(level) || 1;
    const rows = roleChoiceRows(role).filter((f) => f.level <= lvl);
    if (callingId != null && callingId !== '' && lvl >= SUBCLASS_LEVEL) {
        const calling = getCalling(role, callingId);
        if (calling) rows.push(...callingChoiceRows(calling).filter((f) => f.level <= lvl));
    }
    return rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}


// ----- Starting gear from the pack (not class_item_proficiencies) -----
const ARMOR_PROF_TO_TYPE = {
    'light armor': 'light',
    'medium armor': 'medium',
    'heavy armor': 'heavy',
    shields: 'shield',
    shield: 'shield',
};

export function armorTypesFromProf(armorProf) {
    const types = new Set();
    for (const part of String(armorProf ?? '').split(',')) {
        const key = part.trim().toLowerCase();
        if (!key || key === '-' || key === 'none' || key === 'null') continue;
        const t = ARMOR_PROF_TO_TYPE[key];
        if (t) types.add(t);
    }
    return [...types];
}

export function weaponCategoryNamesFromProf(weaponProf) {
    return String(weaponProf ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== '-' && s.toLowerCase() !== 'none' && s.toLowerCase() !== 'null');
}

function isCommonItem(row) {
    return String(row?.rarity ?? 'common').toLowerCase() === 'common';
}

/** Starting weapons + armor for a role (pack proficiencies + pack catalogs). Same shape as listStartingGear. */
export function listStartingGearForRole(roleId, callingId = null, level = 1) {
    const role = getRole(roleId);
    if (!role) return { armor: [], weapons: [] };
    const calling = getCalling(role, callingId);
    const armorProf = calling?.armor_prof || role.armor_prof;
    const weaponProf = calling?.weapon_prof || role.weapon_prof;
    const armorTypes = new Set(armorTypesFromProf(armorProf));
    const catNames = new Set(weaponCategoryNamesFromProf(weaponProf).map((n) => n.toLowerCase()));
    const catById = new Map((content.weapon_category ?? []).map((c) => [Number(c.id), c]));
    const allowedCatIds = new Set(
        (content.weapon_category ?? [])
            .filter((c) => catNames.has(String(c.name).toLowerCase()))
            .map((c) => Number(c.id))
    );

    const armor = (content.armor ?? [])
        .filter((a) => armorTypes.has(String(a.armor_type).toLowerCase()) && isCommonItem(a))
        .map((a) => ({
            id: a.id,
            name: a.name,
            armor_type: a.armor_type,
            armor_category: a.armor_type,
            ac_bonus: a.ac_bonus,
            rarity: a.rarity,
            con_cap: a.con_cap,
            stealth_disadvantage: a.stealth_disadvantage,
        }))
        .sort((x, y) => x.name.localeCompare(y.name));

    const weapons = (content.weapons ?? [])
        .filter((w) => allowedCatIds.has(Number(w.category_id)) && isCommonItem(w) && !w.is_unique)
        .map((w) => {
            const cat = catById.get(Number(w.category_id));
            return {
                id: w.id,
                name: w.name,
                category: w.category,
                category_id: w.category_id,
                weapon_category: cat?.name ?? null,
                damage_dice: w.damage_dice,
                damage_type: w.damage_type,
                rarity: w.rarity,
                attack_bonus: w.attack_bonus,
                is_unique: w.is_unique,
                properties: w.properties,
                range_normal: w.range_normal,
                range_long: w.range_long,
                versatile_dice: w.versatile_dice,
            };
        })
        .sort((x, y) => x.name.localeCompare(y.name));

    return { armor, weapons };
}

// ----- Divine Blessing (pack) schedule + options; replaces legacy Ability Boost / Primordial Ascent -----
export const DIVINE_BLESSING_NAME = 'Divine Blessing';
export const DIVINE_BLESSING_LEVELS_FALLBACK = [4, 6, 10, 12, 16, 18];
export const KEPT_BOOST = 'Kept boost (already in scores)';

const SCORE_STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/** Levels where the pack puts a Divine Blessing marker for this role. */
export function divineBlessingLevelsForRole(role) {
    const levels = [];
    for (const lvl of role?.levels ?? []) {
        if ((lvl.features ?? []).some((f) => f.name === DIVINE_BLESSING_NAME || f.marker === 'divine_blessing')) {
            levels.push(Number(lvl.level));
        }
    }
    return levels.length ? levels : [...DIVINE_BLESSING_LEVELS_FALLBACK];
}

/** Score + blessing option strings for Divine Blessing dropdowns (from pack). */
export function boostOptionStrings({ ascent = false } = {}) {
    const out = [];
    if (ascent) {
        for (const s of SCORE_STATS) out.push(`+1 ${s}`);
    } else {
        for (const s of SCORE_STATS) out.push(`+2 ${s}`);
        for (const b of content.primordial_blessings ?? []) {
            // Blessings that name a score are expanded like the DB class_features.options list
            const name = b.name;
            if (/iron resolve/i.test(name)) {
                for (const s of SCORE_STATS) out.push(`Iron Resolve (+1 ${s})`);
            } else if (/keen wits/i.test(name)) {
                for (const s of ['INT', 'WIS', 'CHA']) out.push(`Keen Wits (+1 ${s})`);
            } else {
                out.push(name);
            }
        }
    }
    out.push(KEPT_BOOST);
    return out;
}

/**
 * Pack-sourced Divine Blessing rows for create step 3 / editor / validation.
 * Keys are scheme A: class:<roleKey>:Divine Blessing:<level>
 * (Pack has no Primordial Ascent.)
 */
export function boostRowsForRole(roleId) {
    const role = getRole(roleId);
    if (!role?.key) return [];
    const options = boostOptionStrings({ ascent: false });
    return divineBlessingLevelsForRole(role).map((level) => {
        const key = choiceKey('class', role.key, DIVINE_BLESSING_NAME, level);
        return {
            id: key,
            key,
            level,
            name: DIVINE_BLESSING_NAME,
            options,
            choice_count: 1,
            source: 'class',
        };
    });
}

/** Pack-sourced blessing rows for prereq checks: [{ name, prerequisite, repeatable_max }] */
export function primordialBlessingsFromPack() {
    return (content.primordial_blessings ?? []).map((b) => ({
        name: b.name,
        prerequisite: b.prerequisite,
        repeatable_max: b.repeatable_max ?? 1,
    }));
}

/** Role armor/weapon proficiency strings for blessing prereqs (pack). */
export function roleProficiencyContext(roleId, callingId = null) {
    const role = getRole(roleId);
    if (!role) return { armor: '', weapons: '', caster: false };
    const calling = getCalling(role, callingId);
    const armor = [role.armor_prof, calling?.armor_prof].filter(Boolean).join(', ');
    const weapons = [role.weapon_prof, calling?.weapon_prof].filter(Boolean).join(', ');
    const casterType = String(role.caster_type ?? 'none').toLowerCase();
    const caster = casterType !== 'none' && casterType !== 'body';
    return { armor, weapons, caster };
}

/** Flatten role (+ calling) feature schedule for description lists (no legacy Fighting Style). */
export function flattenFeaturesForRole(roleId, callingId = null, maxLevel = 30) {
    const role = getRole(roleId);
    if (!role) return [];
    const lvlMax = Number(maxLevel) || 30;
    const out = [];
    for (const lvl of role.levels ?? []) {
        if (Number(lvl.level) > lvlMax) continue;
        for (const f of lvl.features ?? []) {
            out.push({
                level: Number(lvl.level),
                name: f.name,
                description: f.description || '',
                source: 'class',
                key: `pack:class:${role.key}:${f.name}:${lvl.level}`,
            });
        }
    }
    if (callingId != null && callingId !== '' && lvlMax >= SUBCLASS_LEVEL) {
        const calling = getCalling(role, callingId);
        for (const f of calling?.features ?? []) {
            if (Number(f.level) > lvlMax) continue;
            out.push({
                level: Number(f.level),
                name: `${f.name} (${calling.name})`,
                description: f.description || '',
                source: 'subclass',
                key: `pack:subclass:${calling.key}:${f.name}:${f.level}`,
            });
        }
    }
    return out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export default content;
