// Max cantrips / leveled spells known per class by level (index 0 = level 1).
// Source: Codex draft spell-learn-limits.md (2026-10-12). Subclasses use their parent class.
export const SPELL_LIMITS = {
    Mage: {
        cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7],
        spells: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
    },
    Priest: {
        cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7],
        spells: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
    },
    Seer: {
        cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6],
        spells: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
    },
    Songsmith: {
        cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6],
        spells: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
    },
    Witch: {
        cantrips: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        spells: [4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11, 11, 12, 13, 13, 14, 15, 15, 16, 17, 17, 18, 19, 19, 20, 21, 21, 22, 23, 23],
    },
    Summoner: {
        cantrips: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        spells: [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17],
    },
    Templar: {
        cantrips: [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        spells: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
    },
    Wraith: {
        cantrips: [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        spells: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
    },
    // Reaver: half caster (Gabriel 2026-10-25). Casts from spells known, ceil(level / 2) + 1 from L2, no separate prepared pool.
    // Cantrips 2 at L2, 3 at L10, plus Soulbrand (a bonus spell, not counted).
    Reaver: {
        knownOnly: true,
        cantrips: [0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        spells: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
    },
    Ranger: {
        cantrips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        spells: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
    },
};

// Body Magic (martial-magic-for-major.md): one known count that cantrips share, 1/2/3/4 at L5/10/20/30. No slots.
const BODY_KNOWN = Array.from({ length: 30 }, (_, i) => (i + 1 >= 30 ? 4 : i + 1 >= 20 ? 3 : i + 1 >= 10 ? 2 : i + 1 >= 5 ? 1 : 0));
for (const name of ['Warrior', 'Assassin', 'Knight', 'Berserker', 'Pugilist', 'Lancer']) {
    SPELL_LIMITS[name] = { shared: true, cantrips: BODY_KNOWN, spells: BODY_KNOWN };
}

// Highest Body Magic spell level: 1st at L5, 2nd at L15, 3rd at L25 (0 = none yet)
export const bodyMaxLevel = (level) => (level >= 25 ? 3 : level >= 15 ? 2 : level >= 5 ? 1 : 0);

// Subclass casters (the base class casts nothing). Checked before the class table.
export const SUBCLASS_SPELL_LIMITS = {
    // full caster (Gabriel 2026-10-25): same limits as the Songsmith
    'Mark of Possession': {
        cantrips: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6],
        spells: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
    },
};

// Returns { cantrips, spells } for that class (or subclass) at that level, or null if there is no cap.
export function getLearnLimits(className, level, subclassName = null) {
    const sub = Object.keys(SUBCLASS_SPELL_LIMITS).find((k) => k.toLowerCase() === String(subclassName ?? '').trim().toLowerCase());
    if (sub) {
        const j = Math.min(Math.max(Number(level) || 1, 1), 30) - 1;
        return { cantrips: SUBCLASS_SPELL_LIMITS[sub].cantrips[j], spells: SUBCLASS_SPELL_LIMITS[sub].spells[j] };
    }
    const key = Object.keys(SPELL_LIMITS).find((k) => k.toLowerCase() === String(className ?? '').trim().toLowerCase());
    if (!key) return null;
    const i = Math.min(Math.max(Number(level) || 1, 1), 30) - 1;
    return { cantrips: SPELL_LIMITS[key].cantrips[i], spells: SPELL_LIMITS[key].spells[i], knownOnly: !!SPELL_LIMITS[key].knownOnly, shared: !!SPELL_LIMITS[key].shared };
}

// Known vs prepared (Gabriel 2026-10-16): a caster can learn up to 2x the spells limit above and prepare only the limit.
// Cantrips are unchanged (learn and prepare up to the cantrip limit). Returns null when the class has no cap.
export function getSpellCaps(className, level, subclassName = null) {
    const l = getLearnLimits(className, level, subclassName);
    if (!l) return l;
    // known-only casters (Reaver, Body Magic) can prepare everything they know; shared = cantrips count toward the same total
    if (l.knownOnly || l.shared) return { cantrips: l.cantrips, prepared: l.spells, known: l.spells, shared: l.shared };
    return { cantrips: l.cantrips, prepared: l.spells, known: l.spells * 2 };
}
/*prep-done*/
