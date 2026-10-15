// The Character Editor page (/characters/:id/edit) as JSON for React. Queries live in models/.
// Every save answers with the fresh character so React can show the new values.
import * as Characters from '../models/characterModel.js';
import { listRaces } from '../models/raceModel.js';
import { listClasses, listAllSubclasses, getSubclassClassId } from '../models/classModel.js';

// GET /api/characters/:id/edit  -> { character, races, classes, subClasses }
export async function getEditCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const character = await Characters.getEditCharacter(Number(req.params.id), req.session.userId);
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const races = await listRaces();
    const classes = await listClasses();
    const subClasses = await listAllSubclasses();
    res.json({ character, races, classes, subClasses });
}

// POST /api/characters/:id/edit/name   body: { name, race_id }
export async function editNameAndRace(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const { name, race_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!race_id) return res.status(400).json({ error: 'Race is required' });

    await Characters.updateNameAndRace(charId, req.session.userId, name, race_id);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/portrait   body: { portrait_url }  (null = default image)
const PORTRAIT_PATH = /^\/portraits\/[a-z0-9-]+\.png$/;
export async function editPortrait(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const url = req.body.portrait_url ?? null;
    if (url !== null && (typeof url !== 'string' || !PORTRAIT_PATH.test(url))) {
        return res.status(400).json({ error: 'Invalid portrait' });
    }
    if (!(await Characters.ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }
    await Characters.updatePortrait(charId, req.session.userId, url);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/class   body: { class_id, subclass_id }
export async function editClass(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const class_id = Number(req.body.class_id);
    const subclass_id = req.body.subclass_id ? Number(req.body.subclass_id) : null;

    // subclass only from SUBCLASS_LEVEL up (checked against the saved level)
    const ch = await Characters.getLevelInfo(charId, req.session.userId);
    if (!ch) return res.status(404).json({ error: 'Character not found' });
    const level = Number(ch.level) || 1;
    if (level < Characters.SUBCLASS_LEVEL && subclass_id) {
        return res.status(400).json({ error: `Subclass unlocks at level ${Characters.SUBCLASS_LEVEL}` });
    }
    if (level >= Characters.SUBCLASS_LEVEL && !subclass_id) return res.status(400).json({ error: 'Pick a subclass' });

    if (subclass_id) {
        const subClassId = await getSubclassClassId(subclass_id);
        if (subClassId === undefined || Number(subClassId) !== class_id) {
            return res.status(400).json({ error: 'Subclass does not match class' });
        }
    }

    await Characters.updateClass(charId, req.session.userId, class_id, subclass_id);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/features   body: { source: 'class'|'subclass', feature_id, choices: [...] }
// (a single { choice: 'x' } is accepted too). Saves one feature pick into characters.feature_choices
// under the key "<source>:<feature_id>". The feature must belong to the character's saved
// class/subclass, be unlocked at its level, and every pick must be one of the feature's options.
export async function editFeatureChoice(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const { source, feature_id } = req.body;
    if (source !== 'class' && source !== 'subclass') return res.status(400).json({ error: 'source must be class or subclass' });
    const featureId = Number(feature_id);
    if (!Number.isInteger(featureId)) return res.status(400).json({ error: 'feature_id is required' });

    const f = await Characters.getCharacterFeature(charId, req.session.userId, source, featureId);
    if (!f) return res.status(404).json({ error: 'That feature is not part of this character\'s class or subclass' });
    if (!f.options?.length) return res.status(400).json({ error: `${f.name} has no choices` });
    if (Number(f.level) > Number(f.char_level)) {
        return res.status(400).json({ error: `${f.name} unlocks at level ${f.level}` });
    }

    const choices = Array.isArray(req.body.choices) ? req.body.choices : [req.body.choice];
    const count = f.choice_count ?? 1;
    if (choices.length !== count) return res.status(400).json({ error: `Pick exactly ${count} for ${f.name}` });
    if (!choices.every((c) => typeof c === 'string' && f.options.includes(c))) {
        return res.status(400).json({ error: `That is not an option for ${f.name}` });
    }
    if (new Set(choices).size !== choices.length) return res.status(400).json({ error: 'Each option can only be picked once' });

    await Characters.setFeatureChoice(charId, req.session.userId, `${source}:${featureId}`, choices);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/level   body: { level }
// Each level adds (hit die / 2 + 1 + CON mod), at least 1.
// Going below SUBCLASS_LEVEL clears the subclass and its feature picks (in updateLevel).
export async function editLevel(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const level = Number(req.body.level);
    if (!Number.isInteger(level) || level < 1 || level > 30) {
        return res.status(400).json({ error: 'Level must be an integer from 1 to 30' });
    }

    const ch = await Characters.getLevelInfo(charId, req.session.userId);
    if (!ch) return res.status(404).json({ error: 'Character not found' });

    const conMod = Math.floor(Number(ch.con) / 2) - 5;
    const perLvl = Math.max(1, Math.floor(Number(ch.hitpoint_die) / 2) + 1 + conMod);
    const oldLvl = Number(ch.level) || 1;
    const baseHp = Number(ch.max_hp) - (oldLvl - 1) * perLvl; // level-1 HP
    const newMax = Math.max(1, baseHp + (level - 1) * perLvl);

    await Characters.updateLevel(charId, req.session.userId, level, newMax);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/abilities   body: { str, dex, con, int, wis, cha, luc, spd }
export async function editAbilities(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const { str, dex, con, int, wis, cha, luc, spd } = req.body;

    const vals = [str, dex, con, int, wis, cha, luc, spd].map((v) => Number(v));
    if (vals.some((v) => !Number.isInteger(v) || v < 3 || v > 18)) {
        return res.status(400).json({ error: 'Ability scores must be integers from 3 to 18' });
    }

    await Characters.updateAbilities(charId, req.session.userId, vals);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}
