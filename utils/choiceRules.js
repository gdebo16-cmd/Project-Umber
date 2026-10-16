// Swap rule for class choices (rework-2026-10-16/class-choices.md "Swap rule"):
// - option pools (Battle Drills, Arcane Theorems, ...): when you gain a level you can swap ONE pool option;
// - pick-one-of-three rows are permanent, except that the one free re-pick from the blessings migration can be used on one.
// Other choice rows (Fighting Style, Expertise, Ability Boost rows, ...) aren't covered by this rule.
import pool from '../db.js';

export async function checkSwapRules({ classId, level, choices, prev = {}, lastSwapLevel = null, repickAvailable = false }) {
    const { rows } = await pool.query(
        `SELECT f.id, f.name, f.options,
                f.feature_type = 'choice' AND EXISTS (SELECT 1 FROM class_feature_options o WHERE o.class_id = f.class_id AND o.pool = f.name) AS is_pool,
                f.feature_type IS DISTINCT FROM 'choice' AND EXISTS (SELECT 1 FROM class_feature_options o WHERE o.class_id = f.class_id AND o.pool = f.options[1]) AS is_pick3
           FROM class_features f WHERE f.class_id = $1 AND cardinality(f.options) > 0`,
        [classId]
    );
    let swaps = 0;
    let usedRepick = false;
    for (const f of rows) {
        const key = `class:${f.id}`;
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
