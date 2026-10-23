// Class and subclass database reads.
import pool from '../db.js';
import { scorePickDescriptions } from '../utils/abilityBoosts.js';

// Adds option_info { option: description } to each choice feature: pool/alternative options from
// class_feature_options, blessings on Ability Boost rows, score picks, and option A = the feature itself.
async function addOptionInfo(owners, classIdOf) {
    const { rows: opts } = await pool.query(`SELECT class_id, pool, name, description FROM class_feature_options`);
    const { rows: bl } = await pool.query(`SELECT name, tree, prerequisite, description FROM primordial_blessings`);
    const blessings = Object.fromEntries(bl.map((b) => [b.name,
        `${b.tree}'s Blessing${b.prerequisite ? ` (needs ${b.prerequisite})` : ''}: ${b.description}`]));
    const scores = scorePickDescriptions();
    for (const o of owners) {
        for (const f of o.features ?? []) {
            if (!f.options?.length) continue;
            const info = {};
            for (const x of opts) {
                if (x.class_id === classIdOf(o) && (x.pool === f.name || x.pool === f.options[0])) info[x.name] = x.description;
            }
            if (f.options[0] && !info[f.options[0]] && !scores[f.options[0]] && f.description && f.name !== 'Ability Boost') info[f.options[0]] = f.description;
            for (const name of f.options) {
                if (scores[name]) info[name] = scores[name];
                else if (f.name === 'Ability Boost') {
                    const base = name.replace(/ \(\+1 (STR|DEX|CON|INT|WIS|CHA)\)$/, '');
                    if (blessings[base]) info[name] = base === name ? blessings[base] : `${blessings[base]} (your +1 goes to ${name.slice(-4, -1)})`;
                }
            }
            f.option_info = info;
        }
    }
    return owners;
}

export async function listClasses() {
    const { rows } = await pool.query(
        `SELECT c.id, c.name, c.primary_stat, c.hitpoint_die, c.img_url, c.description,
               c.spellcasting, c.spellcasting_stat, c.armor_proficiencies, c.weapon_proficiencies, c.tool_proficiencies, c.saving_throws, c.skill_choice_count, c.skill_options, c.skill_fixed,
               (SELECT json_agg(json_build_object('id', f.id, 'level', f.level, 'name', f.name, 'description', f.description, 'options', f.options, 'choice_count', f.choice_count)
                        ORDER BY f.level, f.sort_order)
                FROM class_features f WHERE f.class_id = c.id) AS features
        FROM classes c
        ORDER BY c.name`
    );
    return addOptionInfo(rows, (c) => c.id);
}

// hit die for one class, or undefined
export async function getHitDie(classId) {
    const { rows } = await pool.query(`SELECT hitpoint_die FROM classes WHERE id = $1`, [classId]);
    return rows[0]?.hitpoint_die;
}

export async function listAllSubclasses() {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.class_id, s.img_url, s.description,
                s.armor_proficiencies, s.weapon_proficiencies, s.tool_proficiencies,
                (SELECT json_agg(json_build_object('id', f.id, 'level', f.level, 'name', f.name, 'description', f.description, 'options', f.options, 'choice_count', f.choice_count)
                         ORDER BY f.level, f.sort_order)
                 FROM subclass_features f WHERE f.subclass_id = s.id) AS features
         FROM sub_classes s ORDER BY s.name`
    );
    return rows;
}

export async function listSubclassesForClass(classId) {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.img_url, s.description,
                s.armor_proficiencies, s.weapon_proficiencies, s.tool_proficiencies,
                (SELECT json_agg(json_build_object('id', f.id, 'level', f.level, 'name', f.name, 'description', f.description, 'options', f.options, 'choice_count', f.choice_count)
                         ORDER BY f.level, f.sort_order)
                 FROM subclass_features f WHERE f.subclass_id = s.id) AS features
         FROM sub_classes s
         WHERE s.class_id = $1
         ORDER BY s.name`,
        [classId]
    );
    return rows;
}

// true if the subclass belongs to the class (creation step 2)
export async function subclassBelongsToClass(subclassId, classId) {
    const { rows } = await pool.query(
        "SELECT 1 FROM sub_classes WHERE id = $1 and class_id = $2",
        [subclassId, classId]
    );
    return rows.length > 0;
}

// skill rules for one class (creation step 2 validation), or undefined
export async function getClassSkills(classId) {
    const { rows } = await pool.query(
        `SELECT skill_choice_count, skill_options, skill_fixed FROM classes WHERE id = $1`,
        [classId]
    );
    return rows[0];
}

// class_id of a subclass, or undefined (editor)
export async function getSubclassClassId(subclassId) {
    const { rows } = await pool.query(`SELECT class_id FROM sub_classes WHERE id = $1`, [subclassId]);
    return rows[0]?.class_id;
}
