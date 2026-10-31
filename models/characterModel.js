// Character database reads and writes: sheet data, hp, levels, stats, create/delete.
import pool from '../db.js';
import { withEffectiveScores, effectiveScores, getBoostRows, statCap } from '../utils/abilityBoosts.js';
import { getSpellCaps } from '../utils/spellLimits.js'; /*prep-done*/
import { resolveSpeciesWrite, resolveRoleWrite } from './idMap.js';
import content, { choiceFeaturesForRole, getRole, getCalling, scoreKey, hitDieSides } from './content.js';

// a character can only have a subclass from this level up (creator + editor check this too)
export const SUBCLASS_LEVEL = 3;
export const MAX_LEVEL = 30;

function featureById(id) {
    return (content.features ?? []).find((f) => Number(f.id) === Number(id));
}
function personalityById(id) {
    return (content.personality_options ?? []).find((p) => Number(p.id) === Number(id));
}
function speciesById(id) {
    return (content.species ?? []).find((s) => Number(s.id) === Number(id));
}
function hpBonusFromPack(callingId, level) {
    if (callingId == null || callingId === '') return 0;
    const lvl = Number(level) || 1;
    let per = 0;
    for (const cf of content.calling_features ?? []) {
        if (Number(cf.calling_id) !== Number(callingId)) continue;
        if (Number(cf.level) > lvl) continue;
        per += Number(cf.hp_per_level) || 0;
    }
    return per * lvl;
}
function enrichSheetFields(ch) {
    if (!ch) return ch;
    const sp = speciesById(ch.species_id);
    const parent = sp?.parent_id != null ? speciesById(sp.parent_id) : null;
    const role = getRole(ch.role_id);
    const calling = getCalling(role, ch.calling_id);
    const legacyRace = (content.legacy_races ?? []).find((r) => Number(r.id) === Number(ch.race_id));
    const legacySub = (content.legacy_subraces ?? []).find((r) => Number(r.id) === Number(ch.subrace_id));
    ch.race_name = parent?.name ?? sp?.name ?? legacyRace?.name ?? null;
    ch.subrace_name = sp?.parent_id != null ? sp.name : (legacySub?.name ?? null);
    ch.class_name = role?.name ?? null;
    ch.hitpoint_die = hitDieSides(role?.hit_die);
    ch.subclass_spellcasting_stat = calling?.spellcasting_stat || null;
    ch.class_spellcasting_stat = role?.spell_stat || null;
    ch.caster_type = calling?.caster_type || role?.caster_type || null;
    ch.has_embers = role?.has_embers ?? false;
    ch.crack_max = role?.crack_max ?? null;
    ch.breach_dc = role?.breach_dc ?? null;
    ch.breach_dc_scaling = role?.breach_dc_scaling ?? null;
    ch.class_saving_throws = role?.saving_throws ?? null;
    ch.breach_effect = calling?.breach_effect ?? null;
    ch.breach_drains_embers = calling?.breach_drains_embers ?? false;
    const armorParts = [role?.armor_prof, calling?.armor_prof].filter(Boolean);
    const weaponParts = [role?.weapon_prof, calling?.weapon_prof].filter(Boolean);
    const toolParts = [role?.tool_prof, calling?.tool_prof].filter(Boolean);
    ch.armor_proficiencies = armorParts.length ? armorParts.join(', ') : null;
    ch.weapon_proficiencies = weaponParts.length ? weaponParts.join(', ') : null;
    ch.tool_proficiencies = toolParts.length ? toolParts.join(', ') : null;
    ch.subclass_name = calling?.name ?? null;
    ch.race_base_speed = sp?.speed ?? parent?.speed ?? legacyRace?.base_speed ?? null;
    ch.race_darkvision = !!(sp?.darkvision ?? parent?.darkvision ?? legacyRace?.darkvision);
    for (const cat of ['upbringing', 'lifestyle', 'outlook']) {
        const p = personalityById(ch[`${cat}_id`]);
        ch[`${cat}_name`] = p?.name ?? null;
        ch[`${cat}_flavor`] = p?.flavor ?? null;
        ch[`${cat}_bio`] = p?.bio ?? null;
        ch[`${cat}_perk`] = p?.perk ?? null;
    }
    return ch;
}


// ---------- effective max HP (one place for the sheet, healing and level changes) ----------
// Stored max_hp stays the base (level-up math). Effective max = base + calling hp_per_level x level + CON boost HP.
// alias = characters table alias; level / calling = SQL expressions (default: the row's own level and calling)
// Legacy SQL helpers retained as no-ops for importers; runtime uses hpBonusFromPack + JS effective max.
export function hpBonusSql() { return '0'; }
export function effMaxSql(base, _alias, conBonus) {
    return `(${base} + ${conBonus})`;
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
        `SELECT ch.*
        FROM characters ch
        WHERE ch.id = $1 AND (ch.user_id = $2 OR EXISTS (
            SELECT 1 FROM campaign_members pm
            JOIN campaign_members dm ON dm.campaign_id = pm.campaign_id
            WHERE pm.character_id = ch.id AND dm.user_id = $2 AND dm.role = 'dm'))`,
        [charId, userId]
    );
    if (rows[0]) {
        enrichSheetFields(rows[0]);
        rows[0].hp_bonus = hpBonusFromPack(rows[0].calling_id, rows[0].level);
        rows[0].legacy_subclass_id = rows[0].subclass_id;
        rows[0].subclass_id = rows[0].calling_id;
        const role = getRole(rows[0].role_id);
        const primary = scoreKey(role?.primary_stat);
        rows[0].spell_stat = primary ?? 'str';
        rows[0].casting_stat = scoreKey(role?.spell_stat)
            ?? scoreKey(rows[0].subclass_spellcasting_stat)
            ?? scoreKey(rows[0].class_spellcasting_stat)
            ?? primary
            ?? 'str';
        rows[0].max_hp = Number(rows[0].max_hp) + Number(rows[0].hp_bonus || 0) + await conHpBonus(rows[0]);
        rows[0].spell_limits = getSpellCaps(rows[0].class_name, rows[0].level, rows[0].subclass_name);
    }
    return withEffectiveScores(rows[0]);
}

export async function listCharactersForUser(userId) {
    const { rows } = await pool.query(
        `SELECT ch.id, ch.name, ch.portrait_url, ch.species_id, ch.role_id, ch.calling_id
        FROM characters ch
        WHERE ch.user_id = $1
        ORDER BY ch.name`,
        [userId]
    );
    return rows.map((ch) => {
        const sp = speciesById(ch.species_id);
        const parent = sp?.parent_id != null ? speciesById(sp.parent_id) : null;
        const role = getRole(ch.role_id);
        const calling = getCalling(role, ch.calling_id);
        return {
            id: ch.id,
            name: ch.name,
            portrait_url: ch.portrait_url,
            race: parent?.name ?? sp?.name ?? null,
            class: role?.name ?? null,
            subclass: calling?.name ?? null,
        };
    });
}

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
        `SELECT id, class_id, calling_id, con, level, feature_choices, max_hp FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    if (!found[0]) return undefined;
    const ch = found[0];
    const conBonus = await conHpBonus(ch);
    const effMax = Number(ch.max_hp) + hpBonusFromPack(ch.calling_id, ch.level) + conBonus;
    const { rows } = await pool.query(
        `UPDATE characters c
            SET temp_hp = CASE WHEN $1::int < 0 THEN GREATEST(0, c.temp_hp + $1::int) ELSE c.temp_hp END,
                current_hp = LEAST($4::int,
                    GREATEST(0, c.current_hp + CASE WHEN $1::int < 0 THEN LEAST(0, $1::int + c.temp_hp) ELSE $1::int END))
          WHERE c.id = $2 AND c.user_id = $3
          RETURNING c.current_hp, c.temp_hp, $4::int AS max_hp`,
        [change, charId, userId, effMax]
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
        `SELECT ch.id, ch.name, ch.race_id, ch.subrace_id, ch.species_id, ch.role_id, ch.calling_id,
                ch.class_id, ch.subclass_id,
                ch.level, ch.str, ch.dex, ch.con, ch."int", ch.wis, ch.cha, ch.luc, ch.spd,
                ch.skill_proficiencies, ch.feature_choices, ch.portrait_url, ch.boost_repick_available, ch.last_swap_level, ch.alignment_code
         FROM characters ch
         WHERE ch.id = $1 AND ch.user_id = $2`,
        [charId, userId]
    );
    const ch = rows[0];
    if (ch) {
        const sp = speciesById(ch.species_id);
        ch.race_id = sp?.parent_id ?? sp?.id ?? ch.race_id;
        ch.subrace_id = sp?.parent_id != null ? sp.id : ch.subrace_id;
        ch.class_id = ch.role_id ?? ch.class_id;
        ch.subclass_id = ch.calling_id;
        ch.legacy_class_id = ch.class_id;
        ch.legacy_subclass_id = ch.subclass_id;
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
    const skillFixed = getRole(role.role_id)?.skill_fixed ?? [];
    // subclass_id column kept but no longer dual-written
    if (featureChoices !== undefined) {
        await pool.query(
            `UPDATE characters
                SET skill_proficiencies = CASE WHEN role_id IS DISTINCT FROM $5
                        THEN $7::text[]
                        ELSE skill_proficiencies END,
                    feature_choices = $4::jsonb,
                    class_id = $1, role_id = $5, calling_id = $6
              WHERE id = $2 AND user_id = $3`,
            [legacyClassId, charId, userId, JSON.stringify(featureChoices), role.role_id, role.calling_id, skillFixed]
        );
        return;
    }
    await pool.query(
        `UPDATE characters
            SET skill_proficiencies = CASE WHEN role_id IS DISTINCT FROM $4
                    THEN $6::text[]
                    ELSE skill_proficiencies END,
                feature_choices = CASE
                    WHEN role_id IS DISTINCT FROM $4 THEN '{}'::jsonb
                    WHEN calling_id IS DISTINCT FROM $5 THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                class_id = $1, role_id = $4, calling_id = $5
          WHERE id = $2 AND user_id = $3`,
        [legacyClassId, charId, userId, role.role_id, role.calling_id, skillFixed]
    );
}

// One class/subclass feature as it applies to this character (only if it belongs to the
// character's current class or subclass). source is 'class' or 'subclass'. Or undefined.
export async function getCharacterFeature(charId, userId, source, featureId) {
    const { rows: [ch] } = await pool.query(
        `SELECT id, level, role_id, calling_id FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    if (!ch) return undefined;
    if (source === 'class') {
        const rf = (content.role_features ?? []).find(
            (r) => Number(r.feature_id) === Number(featureId) && Number(r.role_id) === Number(ch.role_id)
        );
        if (!rf) return undefined;
        return {
            id: rf.feature_id,
            name: rf.name,
            level: rf.level,
            options: rf.options,
            choice_count: rf.choice_count,
            char_level: ch.level,
        };
    }
    const cf = (content.calling_features ?? []).find(
        (r) => Number(r.feature_id) === Number(featureId) && Number(r.calling_id) === Number(ch.calling_id)
    );
    if (!cf) return undefined;
    return {
        id: cf.feature_id,
        name: cf.name,
        level: cf.level,
        options: cf.options,
        choice_count: cf.choice_count,
        char_level: ch.level,
    };
}

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
        `SELECT ch.level, ch.con, ch.max_hp, ch.role_id
           FROM characters ch
          WHERE ch.id = $1 AND ch.user_id = $2`,
        [charId, userId]
    );
    if (rows[0]) rows[0].hitpoint_die = hitDieSides(getRole(rows[0].role_id)?.hit_die);
    return rows[0];
}

// Dropping below SUBCLASS_LEVEL clears the subclass and its feature picks
export async function updateLevel(charId, userId, level, newMax) {
    const { rows: found } = await pool.query(
        `SELECT id, class_id, calling_id, con, feature_choices FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    const ch = found[0];
    const conBonus = ch ? await conHpBonus(ch, level) : 0;
    const callingForBonus = level < SUBCLASS_LEVEL ? null : ch?.calling_id;
    const effMax = Number(newMax) + hpBonusFromPack(callingForBonus, level) + conBonus;
    // clamp to the effective max at the new level (subclass bonus only from SUBCLASS_LEVEL up)
    await pool.query(
        `UPDATE characters
            SET level = $1, max_hp = $2, current_hp = LEAST(current_hp, $5::int),
                feature_choices = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN
                        (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                           FROM jsonb_each(feature_choices) AS e(k, v) WHERE k NOT LIKE 'subclass:%')
                    ELSE feature_choices END,
                calling_id = CASE WHEN $1::int < ${SUBCLASS_LEVEL} THEN NULL ELSE calling_id END
          WHERE id = $3 AND user_id = $4`,
        [level, newMax, charId, userId, effMax]
    );
}

export async function getActionFeatures(roleId, callingId, level, speciesId) {
    const lvl = Number(level) || 1;
    const out = [];
    for (const rf of content.role_features ?? []) {
        if (Number(rf.role_id) !== Number(roleId) || Number(rf.level) > lvl) continue;
        if (rf.action_type == null && rf.ember_cost == null && rf.rest_uses == null) continue;
        out.push({
            source: 'class',
            id: rf.feature_id,
            name: rf.name,
            description: rf.description ?? rf.feature_description ?? '',
            level: rf.level,
            action_type: rf.action_type,
            uses: rf.uses,
            dice: rf.dice,
            ember_cost: rf.ember_cost,
            embers_per_die: rf.embers_per_die,
            cost_scaling: rf.cost_scaling,
            dice_scaling: rf.dice_scaling,
            rest_lock: rf.rest_lock,
            kindles_slot: rf.kindles_slot,
            cracks_gained: rf.cracks_gained,
            cracks_removed: rf.cracks_removed,
            rest_uses: rf.rest_uses,
            uses_scaling: rf.uses_scaling,
            on_weapon_hit: rf.on_weapon_hit,
        });
    }
    if (callingId != null && callingId !== '') {
        for (const cf of content.calling_features ?? []) {
            if (Number(cf.calling_id) !== Number(callingId) || Number(cf.level) > lvl) continue;
            if (cf.action_type == null && cf.ember_cost == null && cf.rest_uses == null) continue;
            out.push({
                source: 'subclass',
                id: cf.feature_id,
                name: cf.name,
                description: cf.description ?? cf.feature_description ?? '',
                level: cf.level,
                action_type: cf.action_type,
                uses: cf.uses,
                dice: cf.dice,
                ember_cost: cf.ember_cost,
                embers_per_die: cf.embers_per_die,
                cost_scaling: cf.cost_scaling,
                dice_scaling: cf.dice_scaling,
                rest_lock: cf.rest_lock,
                kindles_slot: cf.kindles_slot,
                cracks_gained: cf.cracks_gained,
                cracks_removed: cf.cracks_removed,
                rest_uses: cf.rest_uses,
                uses_scaling: cf.uses_scaling,
                on_weapon_hit: cf.on_weapon_hit,
            });
        }
    }
    if (speciesId != null && speciesId !== '') {
        for (const sf of content.species_features ?? []) {
            if (Number(sf.species_id) !== Number(speciesId) || Number(sf.level ?? 1) > lvl) continue;
            if (sf.action_type == null) continue;
            out.push({
                source: 'race',
                id: sf.feature_id,
                name: sf.name,
                description: sf.description ?? sf.feature_description ?? '',
                level: sf.level ?? 1,
                action_type: sf.action_type,
                uses: sf.uses,
                dice: sf.dice,
                ember_cost: null,
                embers_per_die: false,
                cost_scaling: null,
                dice_scaling: null,
                rest_lock: null,
                kindles_slot: false,
                cracks_gained: 0,
                cracks_removed: 0,
                rest_uses: null,
                uses_scaling: null,
                on_weapon_hit: false,
            });
        }
    }
    out.sort((a, b) => Number(a.level) - Number(b.level) || String(a.name).localeCompare(String(b.name)));
    return out;
}

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
