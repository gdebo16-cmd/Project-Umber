// Swap rule for class choices (rework-2026-10-16/class-choices.md "Swap rule"):
// - option pools (Battle Drills, Arcane Theorems, ...): when you gain a level you can swap ONE pool option;
// - pick-one-of-three rows are permanent, except that the one free re-pick from the blessings migration can be used on one.
// Other choice rows (Fighting Style, Expertise, Ability Boost rows, ...) aren't covered by this rule.
// Catalog from content pack (class_feature_options + role features); no DB reads.
import content, { getRole } from '../models/content.js';
import { roleIdForLegacyClass } from '../models/idMap.js';

function poolNamesForClass(classId) {
    const set = new Set();
    for (const o of content.class_feature_options ?? []) {
        if (classId == null || Number(o.class_id) === Number(classId)) set.add(o.pool);
    }
    return set;
}

function featureMetaForRole(role, classId) {
    const pools = poolNamesForClass(classId);
    const byKey = new Map();
    const add = (key, name, options) => {
        if (!key || !name) return;
        const is_pool = pools.has(name);
        const is_pick3 = !is_pool && options?.[1] != null && pools.has(options[1]);
        byKey.set(String(key), { name, is_pool, is_pick3 });
    };
    if (!role) return byKey;
    for (const lvl of role.levels ?? []) {
        for (const f of lvl.features ?? []) {
            if (!Array.isArray(f.options) || f.options.length === 0) continue;
            add(`class:${role.key}:${f.name}:${lvl.level}`, f.name, f.options);
            if (f.data?.legacy_class_feature_id != null) add(`class:${f.data.legacy_class_feature_id}`, f.name, f.options);
        }
    }
    for (const rf of content.role_features ?? []) {
        if (Number(rf.role_id) !== Number(role.id)) continue;
        if (!Array.isArray(rf.options) || rf.options.length === 0) continue;
        add(`class:${role.key}:${rf.name}:${rf.level}`, rf.name, rf.options);
        if (rf.legacy_feature_id != null) add(`class:${rf.legacy_feature_id}`, rf.name, rf.options);
        if (rf.feature_id != null) add(`class:${rf.feature_id}`, rf.name, rf.options);
    }
    return byKey;
}

export async function checkSwapRules({ classId, level, choices, prev = {}, lastSwapLevel = null, repickAvailable = false }) {
    const roleId = await roleIdForLegacyClass(classId);
    const role = getRole(roleId);
    const meta = featureMetaForRole(role, classId);
    let swaps = 0;
    let usedRepick = false;
    const keys = new Set([...Object.keys(prev || {}), ...Object.keys(choices || {})]);
    for (const key of keys) {
        const f = meta.get(String(key));
        if (!f) continue;
        const was = prev?.[key]?.[0];
        const now = choices?.[key]?.[0];
        if (!was || was === now) continue; // first pick (or unchanged) is always fine
        if (f.is_pick3) {
            if (!repickAvailable || usedRepick) return { error: `${f.name} is permanent once picked (your free re-pick is used)` };
            usedRepick = true;
        } else if (f.is_pool) {
            swaps += 1;
        }
    }
    if (swaps > 1) return { error: 'You can swap only one pool option per level gained' };
    if (swaps === 1 && lastSwapLevel != null && Number(level) <= Number(lastSwapLevel)) {
        return { error: `You already swapped a pool option at level ${lastSwapLevel}; swap again when you gain a level` };
    }
    return { swapped: swaps === 1, usedRepick };
}