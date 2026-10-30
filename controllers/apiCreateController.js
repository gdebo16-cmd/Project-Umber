// Character creation (4 steps) as JSON for React. Queries live in models/.
// Uses the session "draft locker" (req.session.charDraft) until step 3 saves it.
import { listRaces, listSubraces, checkSubrace } from '../models/raceModel.js';
import { checkBoostRules, allowedBoostOptions } from '../utils/abilityBoosts.js';
import { listClasses, getHitDie, listSubclassesForClass, subclassBelongsToClass, getClassSkills } from '../models/classModel.js';
import { createCharacter, checkFeatureChoices, SUBCLASS_LEVEL, MAX_LEVEL } from '../models/characterModel.js';
import { addWeapon, equipWeapon, addArmor, equipArmor } from '../models/inventoryModel.js';
import { listStartingGearForRole, boostRowsForRole } from '../models/content.js';
import { resolveRoleWrite } from '../models/idMap.js';
import { listMagicOptions, checkMagicPicks } from '../models/magicModel.js';

const STATS = ["str", "dex", "con", "int", "wis", "cha", "luc", "spd"];

// 4d6, drop the lowest
function rollStatValue() {
    const dice = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
    dice.sort((a, b) => a - b);
    return dice[1] + dice[2] + dice[3];
}

export async function getRaces(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    res.json(await listRaces());
}

// GET /api/races/:id/subraces
export async function getSubraces(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    res.json(await listSubraces(Number(req.params.id)));
}

export async function step1Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { name, race_id, subrace_id } = req.body;
    if (!race_id) return res.status(400).json({ error: 'Race Select Required' });
    const subraceId = await checkSubrace(race_id, subrace_id);
    if (subraceId === false) return res.status(400).json({ error: 'That sub-race does not belong to this race' });

    // update the draft instead of replacing it, so going back to step 1 keeps the class picks
    req.session.charDraft = { ...req.session.charDraft, name: name?.trim() || 'One with no name', race_id: Number(race_id), subrace_id: subraceId };
    res.json({ ok: true });
}

// GET /api/create_char/draft  (so the Back/Forward buttons can refill earlier steps)
export function getDraft(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft) return res.json(null);
    res.json({
        name: draft.name,
        race_id: draft.race_id,
        subrace_id: draft.subrace_id ?? null,
        class_id: draft.class_id ?? null,
        subclass_id: draft.subclass_id ?? null,
        level: draft.level ?? 1,
        skill_picks: draft.skill_picks ?? [],
        feature_choices: draft.feature_choices ?? {},
        skill_proficiencies: draft.skill_proficiencies ?? [],
        weapon_id: draft.weapon_id ?? null,
        armor_id: draft.armor_id ?? null,
        hasRolls: !!draft.rolls && Object.keys(draft.rolls).length > 0,
        hasStep3: !!draft.final,
    });
}

export async function getStep2(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    if (!req.session.charDraft) return res.status(409).json({ error: 'Start with step 1' });

    res.json(await listClasses());
}

// GET /api/create_char/gear?classId=&subclassId=&level=
// Starting weapons and armor this class (+ subclass) is proficient with, common items only
export async function getStartingGear(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const classId = Number(req.query.classId);
    if (!Number.isInteger(classId) || classId < 1) return res.status(400).json({ error: 'Class Required' });
    const subclassId = req.query.subclassId ? Number(req.query.subclassId) : null;
    const level = Number(req.query.level ?? 1);
    try {
        // classId/subclassId are role/calling ids from the client
        const role = await resolveRoleWrite(classId, subclassId);
        if (!role?.role_id) return res.status(400).json({ error: 'Class not found' });
        res.json(listStartingGearForRole(role.role_id, role.calling_id, Number.isInteger(level) ? level : 1));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not load starting gear' });
    }
}

// GET /api/create_char/subclasses/:classId  (moved here from the old EJS charController)
export async function selectSubclass(req, res) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not Logged In' });
    }

    try {
        res.json(await listSubclassesForClass(Number(req.params.classId)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not load subclasses' });
    }
}

export async function step2Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    if (!req.session.charDraft) return res.status(409).json({ error: 'Start with step 1' });

    const { class_id, subclass_id } = req.body;
    const level = Number(req.body.level ?? 1);
    if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
        return res.status(400).json({ error: `Level must be an integer from 1 to ${MAX_LEVEL}` });
    }
    if (!class_id) return res.status(400).json({ error: 'Class Required' });
    // subclass only from SUBCLASS_LEVEL up: required there, not allowed below it
    if (level < SUBCLASS_LEVEL && subclass_id) {
        return res.status(400).json({ error: `Subclass unlocks at level ${SUBCLASS_LEVEL}` });
    }
    if (level >= SUBCLASS_LEVEL && !subclass_id) return res.status(400).json({ error: 'Subclass Required' });

    if (subclass_id && !(await subclassBelongsToClass(Number(subclass_id), Number(class_id)))) {
        return res.status(400).json({ error: 'that subclass does not belong to that class' });
    }

    // class skills: exactly skill_choice_count picks, all from skill_options, no repeats, none already fixed
    const rules = await getClassSkills(Number(class_id));
    if (!rules) return res.status(400).json({ error: 'Class not found' });
    const count = rules.skill_choice_count ?? 0;
    const options = rules.skill_options ?? [];
    const fixed = rules.skill_fixed ?? [];
    const skills = req.body.skills ?? [];
    if (!Array.isArray(skills) || skills.length !== count) {
        return res.status(400).json({ error: `Pick exactly ${count} skill${count === 1 ? '' : 's'}` });
    }
    if (!skills.every((s) => typeof s === 'string' && options.includes(s))) {
        return res.status(400).json({ error: 'One of those skills is not an option for this class' });
    }
    if (new Set(skills).size !== skills.length) {
        return res.status(400).json({ error: 'Each skill can only be picked once' });
    }
    if (skills.some((s) => fixed.includes(s))) {
        return res.status(400).json({ error: 'That skill is already given by your class' });
    }

    // Client sends role/calling ids; feature/boost/gear tables still key on legacy class/subclass
    const role = await resolveRoleWrite(Number(class_id), subclass_id ? Number(subclass_id) : null);
    if (!role?.class_id) return res.status(400).json({ error: 'Class not found' });

    // class + subclass feature choices (optional; each must be unlocked at this level)
    const picked = await checkFeatureChoices(role.role_id, role.calling_id, level, req.body.feature_choices, role.class_id);
    if (picked.error) return res.status(400).json({ error: picked.error });
    // boosts/blessings: repeat limits and level/feature prerequisites (scores aren't rolled yet)
    const boost = await checkBoostRules({ classId: role.class_id, subclassId: role.subclass_id, level, base: null, choices: picked.choices });
    if (boost.error) return res.status(400).json({ error: boost.error });

    // starting gear: weapon required, armor optional; both must be on this class's list
    const gear = listStartingGearForRole(role.role_id, role.calling_id, level);
    const weaponId = Number(req.body.weapon_id);
    if (!gear.weapons.some((w) => w.id === weaponId)) {
        return res.status(400).json({ error: 'Pick a starting weapon your class can use' });
    }
    const armorId = req.body.armor_id ? Number(req.body.armor_id) : null;
    if (armorId && !gear.armor.some((a) => a.id === armorId)) {
        return res.status(400).json({ error: 'Your class cannot wear that armor' });
    }

    req.session.charDraft.class_id = Number(class_id);
    req.session.charDraft.subclass_id = subclass_id ? Number(subclass_id) : null;
    req.session.charDraft.role_id = role.role_id;
    req.session.charDraft.calling_id = role.calling_id;
    req.session.charDraft.level = level;
    req.session.charDraft.feature_choices = picked.choices;
    req.session.charDraft.skill_picks = skills; // what the dropdowns show when coming back
    req.session.charDraft.skill_proficiencies = [...fixed, ...skills]; // what gets saved at step 3
    req.session.charDraft.weapon_id = weaponId;
    req.session.charDraft.armor_id = armorId;
    delete req.session.charDraft.final; // class picks changed, so step 3 has to be saved again
    res.json({ ok: true });
}

// Divine Blessing rows (pack) are picked at step 3, once the scores are known
export async function getStep3(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft || !draft.class_id) return res.status(409).json({ error: 'Start with step 1' });

    draft.rolls = draft.rolls ?? {};
    const role = await resolveRoleWrite(Number(draft.class_id), draft.subclass_id ? Number(draft.subclass_id) : null);
    const boostFeatures = boostRowsForRole(role?.role_id).filter((f) => f.level <= (draft.level ?? 1));
    const choices = draft.feature_choices ?? {};
    const boostPicks = Object.fromEntries(boostFeatures.map((f) => [f.key, choices[f.key]]).filter(([, v]) => v));
    res.json({ rolls: draft.rolls, class_id: draft.class_id, subclass_id: draft.subclass_id, level: draft.level ?? 1, boostFeatures, boostPicks, plus2: draft.plus2 ?? '', plus1: draft.plus1 ?? '' });
}

// POST /api/boost_options  body: { class_id, subclass_id, level, scores, feature_choices }
// -> { options: { [feature key]: [allowed options] } } for the Divine Blessing dropdowns
// (creator step 3 and the editor). Same rules as a save; the save still checks.
export async function boostOptions(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const classId = Number(req.body.class_id);
    const level = Number(req.body.level ?? 1);
    if (!classId || !Number.isInteger(level) || level < 1 || level > MAX_LEVEL) return res.status(400).json({ error: 'class_id and level are required' });
    const subclassId = req.body.subclass_id ? Number(req.body.subclass_id) : null;
    const choices = req.body.feature_choices && typeof req.body.feature_choices === 'object' ? req.body.feature_choices : {};
    const role = await resolveRoleWrite(classId, subclassId);
    if (!role?.class_id) return res.status(400).json({ error: 'Class not found' });
    res.json({ options: await allowedBoostOptions({ classId: role.class_id, subclassId: role.subclass_id, level, base: req.body.scores ?? null, choices }) });
}

// POST /api/create_char/roll/:stat  (moved here from the old EJS charController)
export function rollStat(req, res) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not Logged In" });
    }
    const draft = req.session.charDraft;
    if (!draft) return res.status(400).json({ error: "No Character in progress" });

    const stat = req.params.stat;
    if (!STATS.includes(stat)) return res.status(400).json({ error: "Invalid Stat" });

    draft.rolls = draft.rolls ?? {};
    draft.rolls[stat] = rollStatValue(); // re-rollable: every click rolls again
    delete draft.final; // scores changed, so step 3 has to be saved again before step 4
    res.json({ stat, value: draft.rolls[stat] });
}

export async function step3Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft || !draft.class_id) return res.status(409).json({ error: 'Start with step 1' });

    const { plus2, plus1 } = req.body;
    if (!STATS.includes(plus2) || !STATS.includes(plus1)) {
        return res.status(400).json({ error: 'Pick a +2 and a +1 stat' });
    }
    if (plus2 === plus1) {
        return res.status(400).json({ error: 'The +2 and +1 must go to different stats' });
    }

    const rolls = draft.rolls ?? {};
    if (!STATS.every((s) => rolls[s] !== undefined)) {
        return res.status(400).json({ error: 'Roll every stat first' });
    }
    const final = { ...rolls }; // copy the rolls, then add the bonuses
    final[plus2] += 2;
    final[plus1] += 1;

    // boost/blessing picks (step 3): merged into the step 2 choices, checked against the final scores
    const boostPicks = req.body.feature_choices ?? {};
    const merged = { ...(draft.feature_choices ?? {}) };
    for (const [key, vals] of Object.entries(boostPicks)) merged[key] = vals;
    const role = await resolveRoleWrite(draft.class_id, draft.subclass_id ?? null);
    if (!role?.class_id) return res.status(400).json({ error: 'Class not found' });
    const picked = await checkFeatureChoices(role.role_id, role.calling_id, draft.level ?? 1, merged, role.class_id);
    if (picked.error) return res.status(400).json({ error: picked.error });
    const boost = await checkBoostRules({ classId: role.class_id, subclassId: role.subclass_id, level: draft.level ?? 1, base: final, choices: picked.choices });
    if (boost.error) return res.status(400).json({ error: boost.error });
    draft.feature_choices = picked.choices;

    // step 4 (Background) saves the character, so keep the finished scores in the draft
    draft.final = final;
    draft.plus2 = plus2;
    draft.plus1 = plus1;
    res.json({ ok: true });
}

// GET /api/create_char/step4: alignment chart, personality dropdowns, race elements
export async function getStep4(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft || !draft.final) return res.status(409).json({ error: 'Finish step 3 first' });
    const opts = await listMagicOptions(draft.race_id, draft.subrace_id ?? null);
    const races = await listRaces();
    const race = races.find((r) => r.id === draft.race_id);
    res.json({ ...opts, img_url: race?.img_url ?? null });
}

// POST /api/create_char/step4: check the background picks, then save the character
export async function step4Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft || !draft.final) return res.status(409).json({ error: 'Finish step 3 first' });
    const checked = await checkMagicPicks(draft, req.body);
    if (checked.error) return res.status(400).json({ error: checked.error });
    draft.magic = checked.magic;
    const { final, plus2, plus1 } = draft;

    const hitDie = await getHitDie(draft.class_id);
    if (!hitDie) return res.status(400).json({ error: 'Class not found' });

    const baseHealth = Math.floor(Math.random() * hitDie) + 1;
    const conMod = Math.floor(final.con / 2) - 5;
    // same per-level gain as the editor's level change: hit die / 2 + 1 + CON mod, at least 1
    const perLvl = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
    const maxHp = Math.max(1, baseHealth + conMod + ((draft.level ?? 1) - 1) * perLvl);

    const id = await createCharacter(req.session.userId, draft, final, plus2, plus1, maxHp);

    // starting gear picked at step 2: add it to the inventory and equip it
    let gearError = null;
    try {
        if (draft.weapon_id) {
            await addWeapon(id, draft.weapon_id);
            await equipWeapon(id, draft.weapon_id);
        }
        if (draft.armor_id) {
            await addArmor(id, draft.armor_id);
            await equipArmor(id, draft.armor_id);
        }
    } catch (err) {
        console.error('starting gear failed for character', id, err);
        gearError = 'Your character was saved, but the starting gear could not be added. Add it from the Inventory page.';
    }

    delete req.session.charDraft; // the draft is saved, so throw it away
    res.json(gearError ? { id, gearError } : { id });
}

export function clearDraft(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    delete req.session.charDraft;
    res.json({ ok: true });
}
