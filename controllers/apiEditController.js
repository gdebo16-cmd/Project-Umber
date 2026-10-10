// The Character Editor page (/characters/:id/edit) as JSON for React.
// Every save answers with the fresh character so React can show the new values.
import pool from "../db.js";

async function loadEditCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id, name, race_id, class_id, subclass_id, level, str, dex, con, "int", wis, cha, luc, spd
         FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows[0];
}

// GET /api/characters/:id/edit  -> { character, races, classes, subClasses }
export async function getEditCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const character = await loadEditCharacter(Number(req.params.id), req.session.userId);
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const { rows: races } = await pool.query(`SELECT id, name, traits, img_url FROM races ORDER BY name`);
    const { rows: classes } = await pool.query(
        `SELECT id, name, primary_stat, hitpoint_die, img_url, description FROM classes ORDER BY name`
    );
    const { rows: subClasses } = await pool.query(
        `SELECT id, name, class_id, img_url, description FROM sub_classes ORDER BY name`
    );
    res.json({ character, races, classes, subClasses });
}

// POST /api/characters/:id/edit/name   body: { name, race_id }
export async function editNameAndRace(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const { name, race_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!race_id) return res.status(400).json({ error: 'Race is required' });

    await pool.query(
        `UPDATE characters SET name = $1, race_id = $2 WHERE id = $3 AND user_id = $4`,
        [name, race_id, charId, req.session.userId]
    );
    res.json({ character: await loadEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/class   body: { class_id, subclass_id }
export async function editClass(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const class_id = Number(req.body.class_id);
    const subclass_id = Number(req.body.subclass_id);

    const { rows: subs } = await pool.query(`SELECT class_id FROM sub_classes WHERE id = $1`, [subclass_id]);
    if (!subs.length || Number(subs[0].class_id) !== class_id) {
        return res.status(400).json({ error: 'Subclass does not match class' });
    }

    await pool.query(
        `UPDATE characters SET class_id = $1, subclass_id = $2 WHERE id = $3 AND user_id = $4`,
        [class_id, subclass_id, charId, req.session.userId]
    );
    res.json({ character: await loadEditCharacter(charId, req.session.userId) });
}

// POST /api/characters/:id/edit/level   body: { level }
// Same HP math as the EJS editor: each level adds (hit die / 2 + 1 + CON mod), at least 1.
export async function editLevel(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const level = Number(req.body.level);
    if (!Number.isInteger(level) || level < 1 || level > 30) {
        return res.status(400).json({ error: 'Level must be an integer from 1 to 30' });
    }

    const { rows } = await pool.query(
        `SELECT ch.level, ch.con, ch.max_hp, cl.hitpoint_die
           FROM characters ch
           JOIN classes cl ON cl.id = ch.class_id
          WHERE ch.id = $1 AND ch.user_id = $2`,
        [charId, req.session.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Character not found' });
    const ch = rows[0];

    const conMod = Math.floor(Number(ch.con) / 2) - 5;
    const perLvl = Math.max(1, Math.floor(Number(ch.hitpoint_die) / 2) + 1 + conMod);
    const oldLvl = Number(ch.level) || 1;
    const baseHp = Number(ch.max_hp) - (oldLvl - 1) * perLvl; // level-1 HP
    const newMax = Math.max(1, baseHp + (level - 1) * perLvl);

    await pool.query(
        `UPDATE characters
            SET level = $1, max_hp = $2, current_hp = LEAST(current_hp, $2)
          WHERE id = $3 AND user_id = $4`,
        [level, newMax, charId, req.session.userId]
    );
    res.json({ character: await loadEditCharacter(charId, req.session.userId) });
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

    await pool.query(
        `UPDATE characters SET str = $1, dex = $2, con = $3, "int" = $4, wis = $5, cha = $6, luc = $7, spd = $8
         WHERE id = $9 AND user_id = $10`,
        [...vals, charId, req.session.userId]
    );
    res.json({ character: await loadEditCharacter(charId, req.session.userId) });
}
