// Role and calling database reads, shaped like the old classes/sub_classes API.
// Feature choice rows and skill rules still come from the legacy tables (new features are names only).
import pool from '../db.js';
import { scorePickDescriptions } from '../utils/abilityBoosts.js';
import { legacyClassIdForRole } from './idMap.js';

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
        `SELECT ro.id, ro.name, ro.primary_stat, ro.hit_die AS hitpoint_die,
                COALESCE('/glyphs/classes/' || lower(replace(ro.name, ' ', '_')) || '.png', 'Pending Img') AS img_url,
                COALESCE(ro.description, cl.description, 'Pending Understanding') AS description,
                COALESCE(ro.spellcasting, cl.spellcasting) AS spellcasting,
                COALESCE(ro.spellcasting_stat, cl.spellcasting_stat) AS spellcasting_stat,
                COALESCE(ro.armor_proficiencies, cl.armor_proficiencies) AS armor_proficiencies,
                COALESCE(ro.weapon_proficiencies, cl.weapon_proficiencies) AS weapon_proficiencies,
                COALESCE(ro.tool_proficiencies, cl.tool_proficiencies) AS tool_proficiencies,
                COALESCE(ro.saving_throws, cl.saving_throws) AS saving_throws,
                COALESCE(ro.skill_choice_count, cl.skill_choice_count) AS skill_choice_count,
                COALESCE(ro.skill_options, cl.skill_options) AS skill_options,
                COALESCE(ro.skill_fixed, cl.skill_fixed) AS skill_fixed,
                cl.id AS legacy_class_id,
                COALESCE(
                  (SELECT json_agg(json_build_object(
                          'id', f.id, 'level', rf.level, 'name', f.name,
                          'description', COALESCE(rf.description, f.description, ''),
                          'options', COALESCE(rf.options, ARRAY[]::text[]), 'choice_count', COALESCE(rf.choice_count, 0)
                   ) ORDER BY rf.level, f.name)
                   FROM role_features rf
                   JOIN features f ON f.id = rf.feature_id
                   WHERE rf.role_id = ro.id),
                  (SELECT json_agg(json_build_object(
                          'id', f.id, 'level', f.level, 'name', f.name, 'description', f.description,
                          'options', f.options, 'choice_count', f.choice_count
                   ) ORDER BY f.level, f.sort_order)
                   FROM class_features f WHERE f.class_id = cl.id)
                ) AS features
         FROM roles ro
         LEFT JOIN classes cl ON lower(cl.name) = lower(
           CASE ro.name WHEN 'Templar' THEN 'Paladin' WHEN 'Seer' THEN 'Druid' ELSE ro.name END
         )
         ORDER BY ro.sort_order NULLS LAST, ro.name`
    );
    return addOptionInfo(rows, (c) => c.legacy_class_id);
}

export async function getHitDie(classId) {
    // classId is a role id from the create/edit UI
    const { rows } = await pool.query(`SELECT hit_die AS hitpoint_die FROM roles WHERE id = $1`, [classId]);
    if (rows[0]) return rows[0].hitpoint_die;
    const legacy = await legacyClassIdForRole(classId);
    if (!legacy) return undefined;
    const { rows: old } = await pool.query(`SELECT hitpoint_die FROM classes WHERE id = $1`, [legacy]);
    return old[0]?.hitpoint_die;
}

export async function listAllSubclasses() {
    const { rows } = await pool.query(
        `SELECT ca.id, ca.name, ca.role_id AS class_id, NULL::text AS img_url,
                COALESCE(ca.description, sc.description) AS description,
                COALESCE(ca.armor_proficiencies, sc.armor_proficiencies) AS armor_proficiencies,
                COALESCE(ca.weapon_proficiencies, sc.weapon_proficiencies) AS weapon_proficiencies,
                COALESCE(ca.tool_proficiencies, sc.tool_proficiencies) AS tool_proficiencies,
                COALESCE(
                  (SELECT json_agg(json_build_object(
                          'id', f.id, 'level', cf.level, 'name', f.name,
                          'description', COALESCE(cf.description, f.description, ''),
                          'options', COALESCE(cf.options, ARRAY[]::text[]), 'choice_count', COALESCE(cf.choice_count, 0)
                   ) ORDER BY cf.level, f.name)
                   FROM calling_features cf
                   JOIN features f ON f.id = cf.feature_id
                   WHERE cf.calling_id = ca.id),
                  (SELECT json_agg(json_build_object(
                          'id', f.id, 'level', f.level, 'name', f.name, 'description', f.description,
                          'options', f.options, 'choice_count', f.choice_count
                   ) ORDER BY f.level, f.sort_order)
                   FROM subclass_features f WHERE f.subclass_id = sc.id)
                ) AS features
         FROM callings ca
         LEFT JOIN roles ro ON ro.id = ca.role_id
         LEFT JOIN classes cl ON lower(cl.name) = lower(
           CASE ro.name WHEN 'Templar' THEN 'Paladin' WHEN 'Seer' THEN 'Druid' ELSE ro.name END
         )
         LEFT JOIN sub_classes sc ON sc.class_id = cl.id AND lower(sc.name) = lower(ca.name)
         ORDER BY ca.name`
    );
    return rows;
}

export async function listSubclassesForClass(classId) {
    const { rows } = await pool.query(
        `SELECT ca.id, ca.name, NULL::text AS img_url,
                COALESCE(ca.description, sc.description) AS description,
                COALESCE(ca.armor_proficiencies, sc.armor_proficiencies) AS armor_proficiencies,
                COALESCE(ca.weapon_proficiencies, sc.weapon_proficiencies) AS weapon_proficiencies,
                COALESCE(ca.tool_proficiencies, sc.tool_proficiencies) AS tool_proficiencies,
                COALESCE(
                  (SELECT json_agg(json_build_object(
                          'id', f.id, 'level', cf.level, 'name', f.name,
                          'description', COALESCE(cf.description, f.description, ''),
                          'options', COALESCE(cf.options, ARRAY[]::text[]), 'choice_count', COALESCE(cf.choice_count, 0)
                   ) ORDER BY cf.level, f.name)
                   FROM calling_features cf
                   JOIN features f ON f.id = cf.feature_id
                   WHERE cf.calling_id = ca.id),
                  (SELECT json_agg(json_build_object(
                          'id', f.id, 'level', f.level, 'name', f.name, 'description', f.description,
                          'options', f.options, 'choice_count', f.choice_count
                   ) ORDER BY f.level, f.sort_order)
                   FROM subclass_features f WHERE f.subclass_id = sc.id)
                ) AS features
         FROM callings ca
         LEFT JOIN roles ro ON ro.id = ca.role_id
         LEFT JOIN classes cl ON lower(cl.name) = lower(
           CASE ro.name WHEN 'Templar' THEN 'Paladin' WHEN 'Seer' THEN 'Druid' ELSE ro.name END
         )
         LEFT JOIN sub_classes sc ON sc.class_id = cl.id AND lower(sc.name) = lower(ca.name)
         WHERE ca.role_id = $1
         ORDER BY ca.sort_order NULLS LAST, ca.name`,
        [classId]
    );
    return rows;
}

export async function subclassBelongsToClass(subclassId, classId) {
    const { rows } = await pool.query(
        `SELECT 1 FROM callings WHERE id = $1 AND role_id = $2`,
        [subclassId, classId]
    );
    return rows.length > 0;
}

export async function getClassSkills(classId) {
    const legacyId = await legacyClassIdForRole(classId);
    if (!legacyId) return undefined;
    const { rows } = await pool.query(
        `SELECT skill_choice_count, skill_options, skill_fixed FROM classes WHERE id = $1`,
        [legacyId]
    );
    return rows[0];
}

export async function getSubclassClassId(subclassId) {
    const { rows } = await pool.query(`SELECT role_id AS class_id FROM callings WHERE id = $1`, [subclassId]);
    return rows[0]?.class_id;
}
