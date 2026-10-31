// Role and calling reads from the content pack, shaped like the old classes/sub_classes API.
import content, { getRole, hitDieSides, primordialBlessingsFromPack } from './content.js';
import { scorePickDescriptions } from '../utils/abilityBoosts.js';

function featureRowsForRole(role) {
    const out = [];
    for (const lvl of role.levels ?? []) {
        for (const f of lvl.features ?? []) {
            if (f.marker) continue;
            out.push({
                id: `${role.key}:${lvl.level}:${f.name}`,
                level: lvl.level,
                name: f.name,
                description: f.description ?? '',
                options: f.options ?? [],
                choice_count: f.choice_count ?? 0,
                option_info: f.option_info ?? null,
            });
        }
    }
    return out;
}

function featureRowsForCalling(calling) {
    return (calling.features ?? []).map((f) => ({
        id: `${calling.key}:${f.level}:${f.name}`,
        level: f.level,
        name: f.name,
        description: f.description ?? '',
        options: f.options ?? [],
        choice_count: f.choice_count ?? 0,
        option_info: f.option_info ?? null,
    }));
}

function enrichOptionInfo(features) {
    const blessings = Object.fromEntries(
        (primordialBlessingsFromPack() ?? []).map((b) => [
            b.name,
            `${b.tree}'s Blessing${b.prerequisite ? ` (needs ${b.prerequisite})` : ''}: ${b.description}`,
        ])
    );
    const scores = scorePickDescriptions();
    for (const f of features ?? []) {
        if (!f.options?.length) continue;
        const info = { ...(f.option_info ?? {}) };
        if (f.options[0] && !info[f.options[0]] && !scores[f.options[0]] && f.description && f.name !== 'Ability Boost') {
            info[f.options[0]] = f.description;
        }
        for (const name of f.options) {
            if (scores[name]) info[name] = scores[name];
            else if (f.name === 'Ability Boost' || f.name === 'Divine Blessing') {
                const base = name.replace(/ \(\+1 (STR|DEX|CON|INT|WIS|CHA)\)$/, '');
                if (blessings[base]) info[name] = base === name ? blessings[base] : `${blessings[base]} (your +1 goes to ${name.slice(-4, -1)})`;
            }
        }
        f.option_info = info;
    }
    return features;
}

function shapeRole(role) {
    const features = enrichOptionInfo(featureRowsForRole(role));
    return {
        id: role.id,
        name: role.name,
        primary_stat: role.primary_stat,
        hitpoint_die: role.hit_die,
        img_url: role.img_url ?? (role.name ? `/glyphs/classes/${String(role.name).toLowerCase().replace(/ /g, '_')}.png` : 'Pending Img'),
        description: role.description ?? 'Pending Understanding',
        spellcasting: role.spellcasting,
        spellcasting_stat: role.spell_stat,
        armor_proficiencies: role.armor_prof,
        weapon_proficiencies: role.weapon_prof,
        tool_proficiencies: role.tool_prof,
        saving_throws: role.saving_throws,
        skill_choice_count: role.skill_count,
        skill_options: role.skill_options,
        skill_fixed: role.skill_fixed,
        caster_type: role.caster_type,
        has_embers: role.has_embers,
        crack_max: role.crack_max,
        breach_dc: role.breach_dc,
        breach_dc_scaling: role.breach_dc_scaling,
        features,
    };
}

function shapeCalling(role, calling) {
    return {
        id: calling.id,
        name: calling.name,
        class_id: role.id,
        img_url: calling.img_url,
        description: calling.description,
        armor_proficiencies: calling.armor_prof,
        weapon_proficiencies: calling.weapon_prof,
        tool_proficiencies: calling.tool_prof,
        breach_effect: calling.breach_effect,
        breach_drains_embers: calling.breach_drains_embers,
        caster_type: calling.caster_type,
        spellcasting_stat: calling.spellcasting_stat,
        features: enrichOptionInfo(featureRowsForCalling(calling)),
    };
}

export async function listClasses() {
    return (content.roles ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name).localeCompare(String(b.name)))
        .map(shapeRole);
}

export async function getHitDie(classId) {
    return hitDieSides(getRole(classId)?.hit_die);
}

export async function listAllSubclasses() {
    const out = [];
    for (const role of content.roles ?? []) {
        for (const calling of role.callings ?? []) out.push(shapeCalling(role, calling));
    }
    return out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export async function listSubclassesForClass(classId) {
    const role = getRole(classId);
    if (!role) return [];
    return (role.callings ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name).localeCompare(String(b.name)))
        .map((c) => shapeCalling(role, c));
}

export async function subclassBelongsToClass(subclassId, classId) {
    const role = getRole(classId);
    if (!role) return false;
    return (role.callings ?? []).some((c) => Number(c.id) === Number(subclassId));
}

export async function getClassSkills(classId) {
    const role = getRole(classId);
    if (!role) return undefined;
    return {
        skill_choice_count: role.skill_count,
        skill_options: role.skill_options,
        skill_fixed: role.skill_fixed,
    };
}

export async function getSubclassClassId(subclassId) {
    for (const role of content.roles ?? []) {
        if ((role.callings ?? []).some((c) => Number(c.id) === Number(subclassId))) return role.id;
    }
    return undefined;
}