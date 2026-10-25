// Character database reads and writes: sheet data, hp, levels, stats, create/delete.
import pool from '../db.js';
import { withEffectiveScores, effectiveScores, getBoostRows, statCap } from '../utils/abilityBoosts.js';
import { getSpellCaps } from '../utils/spellLimits.js'; /*prep-done*/

// a character can only have a subclass from this level up (creator + editor check this too)
export const SUBCLASS_LEVEL = 3;
export const MAX_LEVEL = 30;

// ---------- effective max HP (one place for the sheet, healing and level changes) ----------
// Stored max_hp stays the base (level-up math). Effective max = base + subclass hp_per_level x level + CON boost HP.
// alias = characters table alias; level / sub = SQL expressions (default: the row's own level and subclass)
export function hpBonusSql(alias, level = `${alias}.level`, sub = `${alias}.subclass_id`) {
    return `(COALESCE((SELECT SUM(sf.hp_per_level) FROM subclass_features sf WHERE sf.subclass_id = ${sub} AND sf.level <= ${level}), 0) * ${level})`;
}
export function effMaxSql(base, alias, conBonus, level, sub) {
    return `(${base} + ${hpBonusSql(alias, level, sub)} + ${conBonus})`;
}
const scoreMod = (s) => Math.floor((Number(s) || 0) / 2) - 5;
// Extra HP from Ability Boost / Primordial Ascent CON picks, retroactive like 5e: (effective CON mod - base CON mod) x level
// ch needs class_id, con (base), feature_choices, level
export async function conHpBonus(ch, level = ch?.level) {
    if (!ch?.class_id) return 0;
    const lvl = Number(level) || 1;
    const eff = effectiveScores(ch, await getBoostRows(ch.class_id), ch.feature_choices ?? {}, lvl);
    return Math.max(0, (scoreMod(eff.con) - scoreMod(ch.con)) * lvl);
}

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
        `SELECT ch.*, r.name AS race_name, sr.name AS subrace_name, cl.name AS class_name, cl.hitpoint_die, cl.primary_stat AS spell_stat, COALESCE(NULLIF(s.spellcasting_stat, ''), NULLIF(cl.spellcasting_stat, ''), cl.primary_stat) AS casting_stat, COALESCE(s.caster_type, cl.caster_type) AS caster_type, cl.has_embers, cl.crack_max, cl.breach_dc, cl.breach_dc_scaling, cl.saving_throws AS class_saving_throws, s.breach_effect, s.breach_drains_embers, NULLIF(concat_ws(', ', cl.armor_proficiencies, s.armor_proficiencies), '') AS armor_proficiencies, NULLIF(concat_ws(', ', cl.weapon_proficiencies, s.weapon_proficiencies), '') AS weapon_proficiencies, NULLIF(concat_ws(', ', cl.tool_proficiencies, s.tool_proficiencies), '') AS tool_proficiencies, s.name AS subclass_name, r.base_speed AS race_base_speed, r.darkvision AS race_darkvision, ${hpBonusSql('ch')} AS hp_bonus,
            pu.name AS upbringing_name, pu.flavor AS upbringing_flavor, pu.bio AS upbringing_bio, pu.perk AS upbringing_perk,
            pl.name AS lifestyle_name, pl.flavor AS lifestyle_flavor, pl.bio AS lifestyle_bio, pl.perk AS lifestyle_perk,
            po.name AS outlook_name, po.flavor AS outlook_flavor, po.bio AS outlook_bio, po.perk AS outlook_perk
        FROM characters ch
        LEFT JOIN races r ON r.id = ch.race_id
        LEFT JOIN subraces sr ON sr.id = ch.subrace_id
        LEFT JOIN classes cl ON cl.id = ch.class_id
        LEFT JOIN sub_classes s ON s.id = ch.subclass_id
        LEFT JOIN personality_options pu ON pu.id = ch.upbringing_id
        LEFT JOIN personality_options pl ON pl.id = ch.lifestyle_id
        LEFT JOIN personality_options po ON po.id = ch.outlook_id
        WHERE ch.id = $1 AND (ch.user_id = $2 OR EXISTS (
            SELECT 1 FROM campaign_members pm
            JOIN campaign_members dm ON dm.campaign_id = pm.campaign_id
            WHERE pm.character_id = ch.id AND dm.user_id = $2 AND dm.role = 'dm'))`,
        [charId, userId]
    );
    // Sheet shows the effective max HP (Rune-Hardened etc.); stored max_hp stays the base for level-up math
    if (rows[0]) rows[0].max_hp = Number(rows[0].max_hp) + Number(rows[0].hp_bonus || 0) + await conHpBonus(rows[0]); // con is still the base here
    // spells: { cantrips, prepared, known } (null = no cap)
    if (rows[0]) rows[0].spell_limits = getSpellCaps(rows[0].class_name, rows[0].level, rows[0].subclass_name);
    return withEffectiveScores(rows[0]);
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

// Heal (+) or damage (-), clamped to 0..effective max HP (see effMaxSql). Damage comes off temp_hp first; healing never touches temp_hp.
// Returns { current_hp, temp_hp, max_hp } or undefined
export async function changeHp(charId, userId, change) {
    const { rows: found } = await pool.query(
        `SELECT id, class_id, con, level, feature_choices FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    if (!found[0]) return undefined;
    const conBonus = await conHpBonus(found[0]);
    const { rows } = await pool.query(
        `UPDATE characters c
            SET temp_hp = CASE WHEN $1::int < 0 THEN GREATEST(0, c.temp_hp + $1::int) ELSE c.temp_hp END,
                current_hp = LEAST(${effMaxSql('c.max_hp', 'c', '$4::int')},
                    GREATEST(0, c.current_hp + CASE WHEN $1::int < 0 THEN LEAST(0, $1::int + c.temp_hp) ELSE $1::int END))
          WHERE c.id = $2 AND c.user_id = $3
          RETURNING c.current_hp, c.temp_hp, ${effMaxSql('c.max_hp', 'c', '$4::int')}::int AS max_hp`,
        [change, charId, userId, conBonus]
    );
    return rows[0];
}

// Temporary HP doesn't stack: keeps the higher of the current and new amount. clear = true sets it to 0 (long rest).
// Returns { temp_hp } or undefined
export async function setTempHp(charId, userId, amount, clear = false) {
    const { rows } = await pool.query(
        `UPDATE characters SET temp_hp = CASE WHEN $4::boolean THEN 0 ELSE GREATEST(temp_hp, $1::int) END
          WHERE id = $2 AND user_id = $3
          RETURNING temp_hp`,
        [amount, charId, userId, clear]
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
    const m = draft.magic ?? {}; // step 4: alignment, personality states, race element
    const { rows } = await pool.query(
        `INSERT INTO characters
           (user_id, name, race_id, subrace_id, class_id, subclass_id,
            str, dex, con, "int", wis, cha, luc, spd, plus2_stat, plus1_stat, max_hp, current_hp,
            skill_proficiencies, level, feature_choices, last_swap_level,
            alignment_code, upbringing_id, lifestyle_id, outlook_id, upbringing_state, lifestyle_state, outlook_state, race_element_id)
         VALUES ($1,$2,$3,$20,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$21::jsonb,$19,
                 $22,$23,$24,$25,$26,$27,$28,$29)
         RETURNING id`,
        [userId, draft.name, draft.race_id, draft.class_id, draft.subclass_id,
         final.str, final.dex, final.con, final.int, final.wis, final.cha, final.luc, final.spd,
         plus2, plus1, maxHp, maxHp, draft.skill_proficiencies ?? [], draft.level ?? 1, draft.subrace_id ?? null,
         JSON.stringify(draft.feature_choices ?? {}),
         m.alignment_code ?? null, m.upbringing_id ?? null, m.lifestyle_id ?? null, m.outlook_id ?? null,
         m.upbringing_state ?? null, m.lifestyle_state ?? null, m.outlook_state ?? null, m.race_element_id ?? null]
    );
    return rows[0].id;
}



// ---------- character editor ----------

export async function getEditCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id, name, race_id, subrace_id, class_id, subclass_id, level, str, dex, con, "int", wis, cha, luc, spd,
                skill_proficiencies, feature_choices, portrait_url, boost_repick_available, last_swap_level, alignment_code
         FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    const ch = rows[0];
    if (ch?.class_id) {
        // base scores stay editable; effective = base + Ability Boost / Ascent picks, capped
        ch.effective_scores = effectiveScores(ch, await getBoostRows(ch.class_id), ch.feature_choices ?? {}, ch.level);
        ch.stat_cap = statCap(ch.level);
    }
    return ch;
}

export async function updateNameAndRace(charId, userId, name, raceId, subraceId = null) {
    await pool.query(
        `UPDATE characters SET name = $1, race_id = $2, subrace_id = $5 WHERE id = $3 AND user_id = $4`,
        [name, raceId, charId, userId, subraceId]
    );
}

// portraitUrl is null (default image) or a validated '/portraits/<file>.png' path
// Alignment chart square (already checked by editAlignment)
export async function updateAlignment(charId, userId, code) {
    await pool.query(`UPDATE characters SET alignment_code = $1 WHERE id = $2 AND user_id = $3`, [code, charId, userId]);
}

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
    // Option pools (several choice rows with the same name, e.g. Battle Drills at 3/9/15): no option twice across the pool
    const seen = new Map();
    for (const [key, vals] of Object.entries(choices)) {
        const f = byKey.get(key);
        if (f.name === 'Ability Boost') continue; // boost rows repeat; checkBoostRules handles repeats
        const pool = `${f.source}:${f.name}`;
        const taken = seen.get(pool) ?? new Set();
        for (const v of vals) {
            if (taken.has(v)) return { error: `You already picked ${v} from ${f.name}` };
            taken.add(v);
        }
        seen.set(pool, taken);
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

// After checkBoostRules/checkSwapRules: lower the re-picked kept boost's score, use up the free re-pick,
// and remember the level of a pool swap (one per level gained)
export async function applyBoostResult(charId, userId, result) {
    if (result?.swapped) {
        await pool.query(`UPDATE characters SET last_swap_level = level WHERE id = $1 AND user_id = $2`, [charId, userId]);
    }
    if (!result?.usedRepick) return;
    const col = { str: 'str', dex: 'dex', con: 'con', int: '"int"', wis: 'wis', cha: 'cha' }[result.refund];
    await pool.query(
        `UPDATE characters SET boost_repick_available = false${col ? `, ${col} = GREATEST(3, ${col} - 2)` : ''}
          WHERE id = $1 AND user_id = $2`,
        [charId, userId]
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
    const { rows: found } = await pool.query(
        `SELECT id, class_id, con, feature_choices FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    const conBonus = found[0] ? await conHpBonus(found[0], level) : 0;
    // clamp to the effective max at the new level (subclass bonus only from SUBCLASS_LEVEL up)
    await pool.query(
        `UPDATE characters
            SET level = $1, max_hp = $2, current_hp = LEAST(current_hp, ${effMaxSql('$2::int', 'characters', '$5::int', '$1::int', `CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN NULL ELSE characters.subclass_id END`)}),
                feature_choices = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                subclass_id = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN NULL ELSE subclass_id END
          WHERE id = $3 AND user_id = $4`,
        [level, newMax, charId, userId, conBonus]
    );
}

export async function getActionFeatures(classId, subclassId, level, raceId) {
    const { rows } = await pool.query(
        `SELECT 'class' AS source, id, name, description, level, action_type, uses, dice, ember_cost, embers_per_die, cost_scaling, dice_scaling, rest_lock, kindles_slot, cracks_gained, cracks_removed, rest_uses, uses_scaling, on_weapon_hit
        FROM class_features
        WHERE class_id = $1 AND level <= $3 AND (action_type IS NOT NULL OR ember_cost IS NOT NULL OR rest_uses IS NOT NULL)
        UNION ALL
        SELECT 'subclass' AS source, id, name, description, level, action_type, uses, dice, ember_cost, embers_per_die, cost_scaling, dice_scaling, rest_lock, kindles_slot, cracks_gained, cracks_removed, rest_uses, uses_scaling, on_weapon_hit
        FROM subclass_features
        WHERE subclass_id = $2 AND level <= $3 AND (action_type IS NOT NULL OR ember_cost IS NOT NULL OR rest_uses IS NOT NULL)
        UNION ALL
        SELECT 'race' AS source, id, name, description, level, action_type, uses, dice, NULL::int, false, NULL::jsonb, NULL::jsonb, NULL::text, false, 0, 0, NULL::int, NULL::jsonb, false
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

// Saved sheet state (slots used, embers, Seal Cracks, uses per rest, conditions, exhaustion). Only the fields in `patch` change.
// Returns the saved state or undefined if the character isn't yours.
export const SHEET_STATE_FIELDS = ['used_slots', 'embers_spent', 'cracks', 'rest_uses', 'conditions', 'exhaustion'];
export async function updateSheetState(charId, userId, patch) {
    const fields = SHEET_STATE_FIELDS.filter((f) => f in patch);
    if (!fields.length) return undefined;
    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const { rows } = await pool.query(
        `UPDATE characters SET ${sets} WHERE id = $1 AND user_id = $2
         RETURNING ${SHEET_STATE_FIELDS.join(', ')}`,
        [charId, userId, ...fields.map((f) => (typeof patch[f] === 'object' ? JSON.stringify(patch[f]) : patch[f]))]
    );
    return rows[0];
}
