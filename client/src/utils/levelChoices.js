// Helpers for pages/LevelChoices.jsx (kept apart so that file only exports a component).

// the choice features that apply at this level, with their feature_choices key
export function choiceFeatures(classFeatures, subFeatures, subName, level) {
    const tag = (list, source) =>
        (list ?? [])
            .filter((f) => f.options?.length && f.level <= level)
            .map((f) => ({
                ...f,
                source,
                key: `${source}:${f.id}`,
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
