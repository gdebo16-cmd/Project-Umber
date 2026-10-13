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

// POST /api/characters/:id/edit/class   body: { class_id, subclass_id }
export async function editClass(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const class_id = Number(req.body.class_id);
    const subclass_id = Number(req.body.subclass_id);

    const subClassId = await getSubclassClassId(subclass_id);
    if (subClassId === undefined || Number(subClassId) !== class_id) {
        return res.status(400).json({ error: 'Subclass does not match class' });
    }

    await Characters.updateClass(charId, req.session.userId, class_id, subclass_id);
    res.json({ character: await Characters.getEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/level   body: { level }
// Each level adds (hit die / 2 + 1 + CON mod), at least 1.
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
