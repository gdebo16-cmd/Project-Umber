// Helpers for pages/LevelChoices.jsx (kept apart so that file only exports a component).

// a pre-rework boost already counted in the scores (migration only; see utils/abilityBoosts.js)
export const KEPT_BOOST = 'Kept boost (already in scores)';

export const SUBCLASS_LEVEL = 3;

// Stable feature_choices key (scheme A) — matches models/content.js choiceKey
export function packChoiceKey(source, ownerKey, featureName, level) {
    return `${source}:${ownerKey}:${featureName}:${level}`;
}

// Create-time choice rows from the content pack (top-level options only; build.ts hoists those).
export function packChoiceFeatures(role, calling, level) {
    const lvl = Number(level) || 1;
    const out = [];
    for (const row of role?.levels ?? []) {
        if (Number(row.level) > lvl) continue;
        for (const f of row.features ?? []) {
            if (!Array.isArray(f.options) || f.options.length === 0) continue;
            const key = packChoiceKey('class', role.key, f.name, row.level);
            out.push({
                ...f,
                id: key,
                key,
                source: 'class',
                level: Number(row.level),
                label: f.name,
                choice_count: f.choice_count ?? 1,
            });
        }
    }
    if (calling && lvl >= SUBCLASS_LEVEL) {
        for (const f of calling.features ?? []) {
            if (!Array.isArray(f.options) || f.options.length === 0) continue;
            if (Number(f.level) > lvl) continue;
            const key = packChoiceKey('subclass', calling.key, f.name, f.level);
            out.push({
                ...f,
                id: key,
                key,
                source: 'subclass',
                level: Number(f.level),
                label: `${f.name} (${calling.name})`,
                choice_count: f.choice_count ?? 1,
            });
        }
    }
    return out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

// the choice features that apply at this level, with their feature_choices key
// Prefer an existing f.key (pack scheme A); else legacy "${source}:${f.id}" (boosts).
export function choiceFeatures(classFeatures, subFeatures, subName, level) {
    const tag = (list, source) =>
        (list ?? [])
            .filter((f) => f.options?.length && f.level <= level)
            .map((f) => ({
                ...f,
                source,
                key: f.key ?? `${source}:${f.id}`,
                label: source === 'subclass' && subName ? `${f.name} (${subName})` : f.name,
            }));
    return [...tag(classFeatures, 'class'), ...tag(subFeatures, 'subclass')].sort((a, b) => a.level - b.level);
}

// keep only picks for features that still apply (drops old class/subclass/level picks)
export function keepPicks(picks, features) {
    const out = {};
    for (const f of features) {
        const vals = (picks?.[f.key] ?? []).filter(Boolean);
        if (vals.length) out[f.key] = vals;
    }
    return out;
}

// Divine Blessing rows: picked on creator step 3 (after the scores), filtered by the server
// (POST /api/boost_options, same rules as utils/abilityBoosts.js on save)
export const BOOST_ROWS = ['Divine Blessing'];
export const isBoostRow = (f) => f.source === 'class' && BOOST_ROWS.includes(f.name);

/** Pack Divine Blessing rows for create/editor (keys scheme A). Options filled by server on step 3. */
export function packBoostFeatures(role) {
    if (!role?.key) return [];
    const levels = [];
    for (const lvl of role.levels || []) {
        if ((lvl.features || []).some((f) => f.name === 'Divine Blessing' || f.marker === 'divine_blessing')) {
            levels.push(Number(lvl.level));
        }
    }
    const schedule = levels.length ? levels : [4, 6, 10, 12, 16, 18];
    return schedule.map((level) => {
        const key = packChoiceKey('class', role.key, 'Divine Blessing', level);
        return {
            id: key,
            key,
            name: 'Divine Blessing',
            level,
            options: ['+2 STR'],
            choice_count: 1,
            source: 'class',
        };
    });
}