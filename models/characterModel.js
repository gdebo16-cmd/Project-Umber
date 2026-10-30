// Character database reads and writes: sheet data, hp, levels, stats, create/delete.
import pool from '../db.js';
import { withEffectiveScores, effectiveScores, getBoostRows, statCap } from '../utils/abilityBoosts.js';
import { getSpellCaps } from '../utils/spellLimits.js'; /*prep-done*/
import { resolveSpeciesWrite, resolveRoleWrite } from './idMap.js';
import { choiceFeaturesForRole, getRole, scoreKey } from './content.js';

// a character can only have a subclass from this level up (creator + editor check this too)
export const SUBCLASS_LEVEL = 3;
export const MAX_LEVEL = 30;

// ---------- effective max HP (one place for the sheet, healing and level changes) ----------
// Stored max_hp stays the base (level-up math). Effective max = base + calling hp_per_level x level + CON boost HP.
// alias = characters table alias; level / calling = SQL expressions (default: the row's own level and calling)
export function hpBonusSql(alias, level = `${alias}.level`, calling = `${alias}.calling_id`) {
    return `(COALESCE((SELECT SUM(cf.hp_per_level) FROM calling_features cf WHERE cf.calling_id = ${calling} AND cf.level <= ${level}), 0) * ${level})`;
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
        `SELECT ch.*, COALESCE(sp_parent.name, sp.name) AS race_name,
            CASE WHEN sp.parent_id IS NOT NULL THEN sp.name ELSE sr.name END AS subrace_name,
            ro.name AS class_name,
            ro.hit_die AS hitpoint_die,
            NULLIF(ca.spellcasting_stat, '') AS subclass_spellcasting_stat,
            NULLIF(ro.spellcasting_stat, '') AS class_spellcasting_stat,
            COALESCE(ca.caster_type, ro.caster_type) AS caster_type,
            ro.has_embers, ro.crack_max, ro.breach_dc, ro.breach_dc_scaling, ro.saving_throws AS class_saving_throws,
            ca.breach_effect, ca.breach_drains_embers,
            NULLIF(concat_ws(', ', ro.armor_proficiencies, ca.armor_proficiencies), '') AS armor_proficiencies,
            NULLIF(concat_ws(', ', ro.weapon_proficiencies, ca.weapon_proficiencies), '') AS weapon_proficiencies,
            NULLIF(concat_ws(', ', ro.tool_proficiencies, ca.tool_proficiencies), '') AS tool_proficiencies,
            ca.name AS subclass_name,
            COALESCE(sp.speed, sp_parent.speed, r.base_speed) AS race_base_speed,
            COALESCE(r.darkvision, false) AS race_darkvision,
            ${hpBonusSql('ch')} AS hp_bonus,
            pu.name AS upbringing_name, pu.flavor AS upbringing_flavor, pu.bio AS upbringing_bio, pu.perk AS upbringing_perk,
            pl.name AS lifestyle_name, pl.flavor AS lifestyle_flavor, pl.bio AS lifestyle_bio, pl.perk AS lifestyle_perk,
            po.name AS outlook_name, po.flavor AS outlook_flavor, po.bio AS outlook_bio, po.perk AS outlook_perk
        FROM characters ch
        LEFT JOIN species sp ON sp.id = ch.species_id
        LEFT JOIN species sp_parent ON sp_parent.id = sp.parent_id
        LEFT JOIN roles ro ON ro.id = ch.role_id
        LEFT JOIN callings ca ON ca.id = ch.calling_id
        LEFT JOIN races r ON r.id = ch.race_id
        LEFT JOIN subraces sr ON sr.id = ch.subrace_id
        LEFT JOIN personality_options pu ON pu.id = ch.upbringing_id
        LEFT JOIN personality_options pl ON pl.id = ch.lifestyle_id
        LEFT JOIN personality_options po ON po.id = ch.outlook_id
        WHERE ch.id = $1 AND (ch.user_id = $2 OR EXISTS (
            SELECT 1 FROM campaign_members pm
            JOIN campaign_members dm ON dm.campaign_id = pm.campaign_id
            WHERE pm.character_id = ch.id AND dm.user_id = $2 AND dm.role = 'dm'))`,
        [charId, userId]
    );
    // API field subclass_id means calling id; keep legacy column value separately
    if (rows[0]) {
        rows[0].legacy_subclass_id = rows[0].subclass_id;
        rows[0].subclass_id = rows[0].calling_id;
    }
    // spell_stat = role main stat; casting_stat = pack role spell_stat (short key), else DB subclass/class, else primary
    if (rows[0]) {
        const role = getRole(rows[0].role_id);
        const primary = scoreKey(role?.primary_stat);
        rows[0].spell_stat = primary ?? 'str';
        rows[0].casting_stat = scoreKey(role?.spell_stat)
            ?? scoreKey(rows[0].subclass_spellcasting_stat)
            ?? scoreKey(rows[0].class_spellcasting_stat)
            ?? primary
            ?? 'str';
    }
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
                COALESCE(sp_parent.name, sp.name) AS race,
                ro.name AS class,
                ca.name AS subclass
        FROM characters ch
        LEFT JOIN species sp ON sp.id = ch.species_id
        LEFT JOIN species sp_parent ON sp_parent.id = sp.parent_id
        LEFT JOIN roles ro ON ro.id = ch.role_id
        LEFT JOIN callings ca ON ca.id = ch.calling_id
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
    const species = await resolveSpeciesWrite(draft.race_id, draft.subrace_id ?? null);
    if (!species) throw new Error('Unknown species');
    const role = await resolveRoleWrite(draft.class_id, draft.subclass_id ?? null);
    if (!role) throw new Error('Unknown role');
    const { rows } = await pool.query(
        `INSERT INTO characters
           (user_id, name, race_id, subrace_id, class_id, subclass_id, species_id, role_id, calling_id,
            str, dex, con, "int", wis, cha, luc, spd, plus2_stat, plus1_stat, max_hp, current_hp,
            skill_proficiencies, level, feature_choices, last_swap_level,
            alignment_code, upbringing_id, lifestyle_id, outlook_id, upbringing_state, lifestyle_state, outlook_state, race_element_id, race_spell_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24::jsonb,$23,
                 $25,$26,$27,$28,$29,$30,$31,$32,$33)
         RETURNING id`,
        [userId, draft.name, species.race_id, species.subrace_id, role.class_id, null,
         species.species_id, role.role_id, role.calling_id,
         final.str, final.dex, final.con, final.int, final.wis, final.cha, final.luc, final.spd,
         plus2, plus1, maxHp, maxHp, draft.skill_proficiencies ?? [], draft.level ?? 1,
         JSON.stringify(draft.feature_choices ?? {}),
         m.alignment_code ?? null, m.upbringing_id ?? null, m.lifestyle_id ?? null, m.outlook_id ?? null,
         m.upbringing_state ?? null, m.lifestyle_state ?? null, m.outlook_state ?? null, m.race_element_id ?? null, m.race_spell_id ?? null]
    );
    return rows[0].id;
}



// ---------- character editor ----------

export async function getEditCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT ch.id, ch.name,
                COALESCE(sp.parent_id, sp.id, ch.race_id) AS race_id,
                CASE WHEN sp.parent_id IS NOT NULL THEN sp.id ELSE ch.subrace_id END AS subrace_id,
                COALESCE(ch.role_id, ch.class_id) AS class_id,
                ch.calling_id AS subclass_id,
                ch.class_id AS legacy_class_id, ch.subclass_id AS legacy_subclass_id,
                ch.level, ch.str, ch.dex, ch.con, ch."int", ch.wis, ch.cha, ch.luc, ch.spd,
                ch.skill_proficiencies, ch.feature_choices, ch.portrait_url, ch.boost_repick_available, ch.last_swap_level, ch.alignment_code
         FROM characters ch
         LEFT JOIN species sp ON sp.id = ch.species_id
         WHERE ch.id = $1 AND ch.user_id = $2`,
        [charId, userId]
    );
    const ch = rows[0];
    if (ch?.legacy_class_id) {
        // base scores stay editable; effective = base + Ability Boost / Ascent picks, capped
        ch.effective_scores = effectiveScores(ch, await getBoostRows(ch.role_id ?? ch.legacy_class_id), ch.feature_choices ?? {}, ch.level);
        ch.stat_cap = statCap(ch.level);
    }
    return ch;
}

export async function updateNameAndRace(charId, userId, name, raceId, subraceId = null) {
    const species = await resolveSpeciesWrite(raceId, subraceId);
    if (!species) throw new Error('Unknown species');
    await pool.query(
        `UPDATE characters SET name = $1, race_id = $2, subrace_id = $5, species_id = $6 WHERE id = $3 AND user_id = $4`,
        [name, species.race_id, charId, userId, species.subrace_id, species.species_id]
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
    const role = await resolveRoleWrite(classId, subclassId);
    if (!role) throw new Error('Unknown role');
    const legacyClassId = role.class_id;
    // subclass_id column kept but no longer dual-written
    if (featureChoices !== undefined) {
        await pool.query(
            `UPDATE characters
                SET skill_proficiencies = CASE WHEN role_id IS DISTINCT FROM $5
                        THEN COALESCE((SELECT skill_fixed FROM classes WHERE id = $1), '{}')
                        ELSE skill_proficiencies END,
                    feature_choices = $4::jsonb,
                    class_id = $1, role_id = $5, calling_id = $6
              WHERE id = $2 AND user_id = $3`,
            [legacyClassId, charId, userId, JSON.stringify(featureChoices), role.role_id, role.calling_id]
        );
        return;
    }
    await pool.query(
        `UPDATE characters
            SET skill_proficiencies = CASE WHEN role_id IS DISTINCT FROM $4
                    THEN COALESCE((SELECT skill_fixed FROM classes WHERE id = $1), '{}')
                    ELSE skill_proficiencies END,
                feature_choices = CASE
                    WHEN role_id IS DISTINCT FROM $4 THEN '{}'::jsonb
                    WHEN calling_id IS DISTINCT FROM $5 THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                class_id = $1, role_id = $4, calling_id = $5
          WHERE id = $2 AND user_id = $3`,
        [legacyClassId, charId, userId, role.role_id, role.calling_id]
    );
}

// One class/subclass feature as it applies to this character (only if it belongs to the
// character's current class or subclass). source is 'class' or 'subclass'. Or undefined.
export async function getCharacterFeature(charId, userId, source, featureId) {
    // Pack features.id via role_features / calling_features (API source still class|subclass)
    if (source === 'class') {
        const { rows } = await pool.query(
            `SELECT f.id, f.name, rf.level, rf.options, rf.choice_count, ch.level AS char_level
               FROM role_features rf
               JOIN features f ON f.id = rf.feature_id
               JOIN characters ch ON ch.role_id = rf.role_id
              WHERE f.id = $1 AND ch.id = $2 AND ch.user_id = $3`,
            [featureId, charId, userId]
        );
        return rows[0];
    }
    const { rows } = await pool.query(
        `SELECT f.id, f.name, cf.level, cf.options, cf.choice_count, ch.level AS char_level
           FROM calling_features cf
           JOIN features f ON f.id = cf.feature_id
           JOIN characters ch ON ch.calling_id = cf.calling_id
          WHERE f.id = $1 AND ch.id = $2 AND ch.user_id = $3`,
        [featureId, charId, userId]
    );
    return rows[0];
}

// Checks feature picks against pack create-time choices (scheme A keys) plus pack
// Divine Blessing rows (scheme A keys). Empty picks are dropped.
// roleId/callingId = content pack ids; legacyClassId = classes.id (mapped to role for boosts).
// Returns { choices } (the cleaned set) or { error }.
export async function checkFeatureChoices(roleId, callingId, level, picks, legacyClassId = null) {
    if (picks == null) return { choices: {} };
    if (typeof picks !== 'object' || Array.isArray(picks)) return { error: 'feature_choices must be an object' };
    const byKey = new Map(choiceFeaturesForRole(roleId, callingId, level).map((f) => [f.key, f]));
    const boostId = roleId ?? legacyClassId;
    if (boostId != null && boostId !== '') {
        const boostRows = await getBoostRows(boostId);
        for (const r of boostRows) {
            if (Number(r.level) > Number(level)) continue;
            const key = r.key || (String(r.id).includes(':') ? String(r.id) : `class:${r.id}`);
            byKey.set(key, {
                source: 'class',
                id: r.id,
                key,
                name: r.name,
                level: Number(r.level),
                options: r.options,
                choice_count: 1,
            });
        }
    }
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
    // Option pools (several choice rows with the same name): no option twice across the pool
    const seen = new Map();
    for (const [key, vals] of Object.entries(choices)) {
        const f = byKey.get(key);
        if (f.name === 'Divine Blessing' || f.name === 'Ability Boost' || f.name === 'Primordial Ascent') continue;
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
        `SELECT ch.level, ch.con, ch.max_hp, ro.hit_die AS hitpoint_die
           FROM characters ch
           LEFT JOIN roles ro ON ro.id = ch.role_id
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
            SET level = $1, max_hp = $2, current_hp = LEAST(current_hp, ${effMaxSql('$2::int', 'characters', '$5::int', '$1::int', `CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN NULL ELSE characters.calling_id END`)}),
                feature_choices = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                calling_id = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN NULL ELSE calling_id END
          WHERE id = $3 AND user_id = $4`,
        [level, newMax, charId, userId, conBonus]
    );
}

export async function getActionFeatures(roleId, callingId, level, speciesId) {
    const { rows } = await pool.query(
        `SELECT 'class' AS source, f.id, f.name, COALESCE(rf.description, f.description) AS description, rf.level,
                rf.action_type, rf.uses, rf.dice, rf.ember_cost, rf.embers_per_die, rf.cost_scaling, rf.dice_scaling,
                rf.rest_lock, rf.kindles_slot, rf.cracks_gained, rf.cracks_removed, rf.rest_uses, rf.uses_scaling, rf.on_weapon_hit
        FROM role_features rf
        JOIN features f ON f.id = rf.feature_id
        WHERE rf.role_id = $1 AND rf.level <= $3 AND (rf.action_type IS NOT NULL OR rf.ember_cost IS NOT NULL OR rf.rest_uses IS NOT NULL)
        UNION ALL
        SELECT 'subclass' AS source, f.id, f.name, COALESCE(cf.description, f.description) AS description, cf.level,
                cf.action_type, cf.uses, cf.dice, cf.ember_cost, cf.embers_per_die, cf.cost_scaling, cf.dice_scaling,
                cf.rest_lock, cf.kindles_slot, cf.cracks_gained, cf.cracks_removed, cf.rest_uses, cf.uses_scaling, cf.on_weapon_hit
        FROM calling_features cf
        JOIN features f ON f.id = cf.feature_id
        WHERE cf.calling_id = $2 AND cf.level <= $3 AND (cf.action_type IS NOT NULL OR cf.ember_cost IS NOT NULL OR cf.rest_uses IS NOT NULL)
        UNION ALL
        SELECT 'race' AS source, f.id, f.name, COALESCE(sf.description, f.description) AS description, sf.level,
                sf.action_type, sf.uses, sf.dice, NULL::int, false, NULL::jsonb, NULL::jsonb, NULL::text, false, 0, 0, NULL::int, NULL::jsonb, false
        FROM species_features sf
        JOIN features f ON f.id = sf.feature_id
        WHERE sf.species_id = $4 AND sf.level <= $3 AND sf.action_type IS NOT NULL
        ORDER BY level, name`,
        [roleId, callingId, level, speciesId]
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
