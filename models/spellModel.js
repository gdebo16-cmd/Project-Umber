// All spell database reads and writes live here. Change a query once and every controller gets it.
import pool from '../db.js';

// Every learned spell for a character, with the details the sheet, Spell Book and details box need
export async function getLearnedSpells(charId) {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.base_level, s.base_damage_dice, s.opponent_save_roll, s.attack_type, s.base_to_hit_modifier, 
                s.range, s.duration, s.casting_time, s.focus_level, s.base_description AS description, s.beam_scaling, s.action_type, s.heal_dice, s.heal_add_mod,
                st.name AS state_name, al."Name" AS alignment_name, el.name AS element_name,
                COALESCE((SELECT json_agg(json_build_object('cast_level', u.cast_level, 'damage_dice', u.damage_dice, 'heal_dice', u.heal_dice, 'extra_targets', u.extra_targets) ORDER BY u.cast_level)
                          FROM spell_upcasts u WHERE u.spell_id = s.id), '[]') AS upcasts,
                cs.is_learned, cs.is_prepared, cs.is_action,
                ab.band AS chart_band
         FROM character_spells cs
         JOIN spells s ON s.id = cs.spell_id
         LEFT JOIN spell_state st ON st.id = s.state_id
         LEFT JOIN spell_alignment al ON al.id = s.alignment_id
         LEFT JOIN characters c ON c.id = cs.character_id
         LEFT JOIN alignment_bands ab ON ab.alignment_code = c.alignment_code AND ab.color_square = al.chart_square
         LEFT JOIN spell_element el ON el.id = s.element_id
         WHERE cs.character_id = $1 AND cs.is_learned
         ORDER BY s.base_level, s.name`,
        [charId]
    );
    return rows;
}

// Every spell (Spell Book list), with the same detail fields + names as getLearnedSpells so the details box works there too
export async function getAllSpells() {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.base_level, s.base_damage_dice, s.opponent_save_roll, s.attack_type, s.base_to_hit_modifier, 
                s.range, s.duration, s.casting_time, s.focus_level, s.base_description AS description, s.beam_scaling, s.action_type, s.heal_dice, s.heal_add_mod,
                st.name AS state_name, al."Name" AS alignment_name, el.name AS element_name,
                COALESCE((SELECT json_agg(json_build_object('cast_level', u.cast_level, 'damage_dice', u.damage_dice, 'heal_dice', u.heal_dice, 'extra_targets', u.extra_targets) ORDER BY u.cast_level)
                          FROM spell_upcasts u WHERE u.spell_id = s.id), '[]') AS upcasts
         FROM spells s
         LEFT JOIN spell_state st ON st.id = s.state_id
         LEFT JOIN spell_alignment al ON al.id = s.alignment_id
         LEFT JOIN spell_element el ON el.id = s.element_id
         ORDER BY s.base_level, s.name`
    );
    return rows;
}

// alignmentCode (optional): adds chart_band, the character's band for each spell's colour square
export async function getSpellsForCharacter(classId, subclassId, level, alignmentCode = null) {
    const { rows } = await pool.query(
        `SELECT s.*, s.base_description AS description, MIN(cs.min_level) AS unlock_level,
                st.name AS state_name, al."Name" AS alignment_name, el.name AS element_name, ab.band AS chart_band
         FROM class_spells cs
         JOIN spells s ON s.id = cs.spell_id
         LEFT JOIN spell_state st ON st.id = s.state_id
         LEFT JOIN spell_alignment al ON al.id = s.alignment_id
         LEFT JOIN spell_element el ON el.id = s.element_id
         LEFT JOIN alignment_bands ab ON ab.alignment_code = $4 AND ab.color_square = al.chart_square
         WHERE cs.class_id = $1 AND (cs.subclass_id IS NULL OR cs.subclass_id = $2) AND cs.min_level <= $3
         GROUP BY s.id, st.name, al."Name", el.name, ab.band
         ORDER BY s.base_level, s.name`,
        [classId, subclassId, level, alignmentCode]
    );
    return rows;
}
// Slot counts for a class (and subclass) at a level from class_spell_slots: [1st, 2nd, ...].
// Subclass rows (subclass_id set) apply when the character's subclass matches, and replace the base-class rows.
// [] = no slots at this level: either none yet (Paladin L1) or no slot rows at all (non-casters like Warrior).
export async function getClassSlots(classId, level, subclassId = null) {
    const { rows } = await pool.query(
        `SELECT slot_level, slots, level, subclass_id FROM class_spell_slots
         WHERE class_id = $1 AND (subclass_id IS NULL OR subclass_id = $3) AND level <= $2`,
        [classId, level, subclassId]
    );
    if (!rows.length) return [];
    const own = rows.some((r) => r.subclass_id !== null) ? rows.filter((r) => r.subclass_id !== null) : rows;
    const slots = [];
    for (const r of own.filter((r) => Number(r.level) === Number(level))) slots[r.slot_level - 1] = r.slots;
    return Array.from(slots, (n) => n || 0);
}

// ---------- spell writes ----------

// If the row already exists (UNIQUE character_id + spell_id), just mark it learned
export async function learnSpell(charId, spellId) {
    await pool.query(
        `INSERT INTO character_spells (character_id, spell_id, is_learned)
        VALUES ($1, $2, true)
        ON CONFLICT (character_id, spell_id) DO UPDATE SET is_learned = true`,
        [charId, spellId]
    );
}

export async function unlearnSpell(charId, spellId) {
    await pool.query(
        `DELETE FROM character_spells WHERE character_id = $1 AND spell_id = $2`,
        [charId, spellId]
    );
}

// Flip is_prepared on a learned spell. Returns rows changed (0 = not learned)
export async function setPrepared(charId, spellId, value) {
    const { rowCount } = await pool.query(
        `UPDATE character_spells SET is_prepared = $3
        WHERE character_id = $1 AND spell_id = $2 AND is_learned`,
        [charId, spellId, value]
    );
    return rowCount;
}

// Flip is_action on a learned spell. Returns rows changed (0 = not learned)
export async function setAction(charId, spellId, value) {
    const { rowCount } = await pool.query(
        `UPDATE character_spells SET is_action = $3
        WHERE character_id = $1 AND spell_id = $2 AND is_learned`,
        [charId, spellId, value]
    );
    return rowCount;
}
