// Character database reads and writes: sheet data, hp, levels, stats, create/delete.
import pool from '../db.js';

// a character can only have a subclass from this level up (creator + editor check this too)
export const SUBCLASS_LEVEL = 3;
export const MAX_LEVEL = 30;

// true if this character belongs to the logged-in user
export async function ownsCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows.length > 0;
}

// Full sheet row (with race/class/subclass names) or undefined
export async function getSheetCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT ch.*, r.name AS race_name, sr.name AS subrace_name, cl.name AS class_name, cl.hitpoint_die, cl.primary_stat AS spell_stat, NULLIF(concat_ws(', ', cl.armor_proficiencies, s.armor_proficiencies), '') AS armor_proficiencies, NULLIF(concat_ws(', ', cl.weapon_proficiencies, s.weapon_proficiencies), '') AS weapon_proficiencies, NULLIF(concat_ws(', ', cl.tool_proficiencies, s.tool_proficiencies), '') AS tool_proficiencies, s.name AS subclass_name, r.base_speed AS race_base_speed
        FROM characters ch
        LEFT JOIN races r ON r.id = ch.race_id
        LEFT JOIN subraces sr ON sr.id = ch.subrace_id
        LEFT JOIN classes cl ON cl.id = ch.class_id
        LEFT JOIN sub_classes s ON s.id = ch.subclass_id
        WHERE ch.id = $1 AND ch.user_id = $2`,
        [charId, userId]
    );
    return rows[0];
}

// Home page list for one user
export async function listCharactersForUser(userId) {
    const { rows } = await pool.query(
        `SELECT ch.id, ch.name, ch.portrait_url,
                r.name AS race,
                c.name AS class,
                sc.name AS subclass
        FROM characters ch
        LEFT JOIN races r ON ch.race_id = r.id
        LEFT JOIN classes c ON ch.class_id = c.id
        LEFT JOIN sub_classes sc ON ch.subclass_id = sc.id
        WHERE ch.user_id = $1
        ORDER BY ch.created_at DESC`,
        [userId]
    );
    return rows;
}

// Just id + name (inventory page header) or undefined
export async function getCharacterName(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id, name FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows[0];
}

// Heal (+) or damage (-), clamped to 0..max_hp. Returns { current_hp, max_hp } or undefined
export async function changeHp(charId, userId, change) {
    const { rows } = await pool.query(
        `UPDATE characters
         SET current_hp = LEAST(max_hp, GREATEST(0, current_hp + $1))
         WHERE id = $2 AND user_id = $3
         RETURNING current_hp, max_hp`,
        [change, charId, userId]
    );
    return rows[0];
}

// Returns how many rows were deleted (0 or 1)
export async function deleteCharacter(charId, userId) {
    const { rowCount } = await pool.query(
        `DELETE FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rowCount;
}

// Save a finished draft. Returns the new id
export async function createCharacter(userId, draft, final, plus2, plus1, maxHp) {
    const { rows } = await pool.query(
        `INSERT INTO characters
           (user_id, name, race_id, subrace_id, class_id, subclass_id,
            str, dex, con, "int", wis, cha, luc, spd, plus2_stat, plus1_stat, max_hp, current_hp,
            skill_proficiencies, level, feature_choices)
         VALUES ($1,$2,$3,$20,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$21::jsonb)
         RETURNING id`,
        [userId, draft.name, draft.race_id, draft.class_id, draft.subclass_id,
         final.str, final.dex, final.con, final.int, final.wis, final.cha, final.luc, final.spd,
         plus2, plus1, maxHp, maxHp, draft.skill_proficiencies ?? [], draft.level ?? 1, draft.subrace_id ?? null,
         JSON.stringify(draft.feature_choices ?? {})]
    );
    return rows[0].id;
}

// ---------- character editor ----------

export async function getEditCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id, name, race_id, subrace_id, class_id, subclass_id, level, str, dex, con, "int", wis, cha, luc, spd,
                skill_proficiencies, feature_choices, portrait_url
         FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows[0];
}

export async function updateNameAndRace(charId, userId, name, raceId, subraceId = null) {
    await pool.query(
        `UPDATE characters SET name = $1, race_id = $2, subrace_id = $5 WHERE id = $3 AND user_id = $4`,
        [name, raceId, charId, userId, subraceId]
    );
}

// portraitUrl is null (default image) or a validated '/portraits/<file>.png' path
export async function updatePortrait(charId, userId, portraitUrl) {
    await pool.query(
        `UPDATE characters SET portrait_url = $1 WHERE id = $2 AND user_id = $3`,
        [portraitUrl, charId, userId]
    );
}

// featureChoices (already checked by checkFeatureChoices) replaces the saved picks when given
export async function updateClass(charId, userId, classId, subclassId, featureChoices) {
    if (featureChoices !== undefined) {
        await pool.query(
            `UPDATE characters
                SET skill_proficiencies = CASE WHEN class_id IS DISTINCT FROM $1
                        THEN COALESCE((SELECT skill_fixed FROM classes WHERE id = $1), '{}')
                        ELSE skill_proficiencies END,
                    feature_choices = $5::jsonb,
                    class_id = $1, subclass_id = $2
              WHERE id = $3 AND user_id = $4`,
            [classId, subclassId, charId, userId, JSON.stringify(featureChoices)]
        );
        return;
    }
    await pool.query(
        // changing class resets skills to the new class's fixed skills (old picks may not be valid)
        `UPDATE characters
            SET skill_proficiencies = CASE WHEN class_id IS DISTINCT FROM $1
                    THEN COALESCE((SELECT skill_fixed FROM classes WHERE id = $1), '{}')
                    ELSE skill_proficiencies END,
                -- class change clears all feature picks; subclass change clears only subclass picks
                feature_choices = CASE
                    WHEN class_id IS DISTINCT FROM $1 THEN '{}'::jsonb
                    WHEN subclass_id IS DISTINCT FROM $2 THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                class_id = $1, subclass_id = $2
          WHERE id = $3 AND user_id = $4`,
        [classId, subclassId, charId, userId]
    );
}

// One class/subclass feature as it applies to this character (only if it belongs to the
// character's current class or subclass). source is 'class' or 'subclass'. Or undefined.
export async function getCharacterFeature(charId, userId, source, featureId) {
    const table = source === 'class' ? 'class_features' : 'subclass_features';
    const ownerCol = source === 'class' ? 'class_id' : 'subclass_id';
    const { rows } = await pool.query(
        `SELECT f.id, f.name, f.level, f.options, f.choice_count, ch.level AS char_level
           FROM ${table} f
           JOIN characters ch ON ch.${ownerCol} = f.${ownerCol}
          WHERE f.id = $1 AND ch.id = $2 AND ch.user_id = $3`,
        [featureId, charId, userId]
    );
    return rows[0];
}

// Checks a whole set of feature picks { "<source>:<feature id>": [values] } against a class,
// subclass and level. Subclass picks only count from SUBCLASS_LEVEL up. Empty picks are dropped.
// Returns { choices } (the cleaned set) or { error }.
export async function checkFeatureChoices(classId, subclassId, level, picks) {
    if (picks == null) return { choices: {} };
    if (typeof picks !== 'object' || Array.isArray(picks)) return { error: 'feature_choices must be an object' };
    const { rows } = await pool.query(
        `SELECT 'class' AS source, id, name, level, options, choice_count
           FROM class_features WHERE class_id = $1 AND cardinality(options) > 0
         UNION ALL
         SELECT 'subclass' AS source, id, name, level, options, choice_count
           FROM subclass_features
          WHERE subclass_id = $2 AND $3::int >= ${SUBCLASS_LEVEL} AND cardinality(options) > 0`,
        [classId, subclassId, level]
    );
    const byKey = new Map(rows.map((f) => [`${f.source}:${f.id}`, f]));
    const choices = {};
    for (const [key, raw] of Object.entries(picks)) {
        const vals = (Array.isArray(raw) ? raw : [raw]).filter((v) => v !== '' && v != null);
        if (!vals.length) continue;
        const f = byKey.get(key);
        if (!f) return { error: 'One of those feature choices is not part of this class or subclass' };
        if (Number(f.level) > level) return { error: `${f.name} unlocks at level ${f.level}` };
        const count = f.choice_count ?? 1;
        if (vals.length !== count) return { error: `Pick exactly ${count} for ${f.name}` };
        if (!vals.every((v) => typeof v === 'string' && f.options.includes(v))) {
            return { error: `That is not an option for ${f.name}` };
        }
        if (new Set(vals).size !== vals.length) return { error: 'Each option can only be picked once' };
        choices[key] = vals;
    }
    return { choices };
}

// Set one feature pick: feature_choices[key] = values (array)
export async function setFeatureChoice(charId, userId, key, values) {
    await pool.query(
        `UPDATE characters SET feature_choices = feature_choices || jsonb_build_object($1::text, $2::jsonb)
          WHERE id = $3 AND user_id = $4`,
        [key, JSON.stringify(values), charId, userId]
    );
}

// level, con, max_hp and class hit die for the level-up math, or undefined
export async function getLevelInfo(charId, userId) {
    const { rows } = await pool.query(
        `SELECT ch.level, ch.con, ch.max_hp, cl.hitpoint_die
           FROM characters ch
           JOIN classes cl ON cl.id = ch.class_id
          WHERE ch.id = $1 AND ch.user_id = $2`,
        [charId, userId]
    );
    return rows[0];
}

// Dropping below SUBCLASS_LEVEL clears the subclass and its feature picks
export async function updateLevel(charId, userId, level, newMax) {
    await pool.query(
        `UPDATE characters
            SET level = $1, max_hp = $2, current_hp = LEAST(current_hp, $2),
                feature_choices = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                subclass_id = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN NULL ELSE subclass_id END
          WHERE id = $3 AND user_id = $4`,
        [level, newMax, charId, userId]
    );
}

export async function getActionFeatures(classId, subclassId, level, raceId) {
    const { rows } = await pool.query(
        `SELECT 'class' AS source, id, name, description, level, action_type, uses, dice
        FROM class_features
        WHERE class_id = $1 AND level <= $3 AND action_type IS NOT NULL
        UNION ALL
        SELECT 'subclass' AS source, id, name, description, level, action_type, uses, dice
        FROM subclass_features
        WHERE subclass_id = $2 AND level <= $3 AND action_type IS NOT NULL
        UNION ALL
        SELECT 'race' AS source, id, name, description, level, action_type, uses, dice
        FROM race_lineage_bonuses
        WHERE race_id = $4 AND level <= $3 AND action_type IS NOT NULL
        ORDER BY level, name`,
        [classId, subclassId, level, raceId]
    );
    return rows;
}

// vals = [str, dex, con, int, wis, cha, luc, spd]
export async function updateAbilities(charId, userId, vals) {
    await pool.query(
        `UPDATE characters SET str = $1, dex = $2, con = $3, "int" = $4, wis = $5, cha = $6, luc = $7, spd = $8
         WHERE id = $9 AND user_id = $10`,
        [...vals, charId, userId]
    );
}
