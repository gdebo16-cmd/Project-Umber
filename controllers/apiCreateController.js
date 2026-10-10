// Character creation (3 steps) as JSON for React.
// Uses the same "draft locker" (req.session.charDraft) as the EJS version.
// Rolling a stat and loading subclasses already answer with JSON, so routes/api.js
// reuses rollStat and selectSubclass straight from charController.js.
import pool from "../db.js";

const STATS = ["str", "dex", "con", "int", "wis", "cha", "luc", "spd"];

// GET /api/create_char/races
export async function getRaces(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const races = await pool.query("SELECT id, name, traits, img_url FROM races ORDER BY name");
    res.json(races.rows);
}

// POST /api/create_char/step1   body: { name, race_id }
export function step1Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { name, race_id } = req.body;
    if (!name || !race_id) return res.status(400).json({ error: 'Name and Race Select Required' });

    req.session.charDraft = { name: name.trim(), race_id: Number(race_id) };
    res.json({ ok: true });
}

// GET /api/create_char/step2  -> list of classes (409 if step 1 wasn't done)
export async function getStep2(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    if (!req.session.charDraft) return res.status(409).json({ error: 'Start with step 1' });

    const classes = await pool.query(
        "SELECT id, name, primary_stat, hitpoint_die, img_url, description FROM classes ORDER BY name"
    );
    res.json(classes.rows);
}

// POST /api/create_char/step2   body: { class_id, subclass_id }
export async function step2Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    if (!req.session.charDraft) return res.status(409).json({ error: 'Start with step 1' });

    const { class_id, subclass_id } = req.body;
    if (!class_id || !subclass_id) return res.status(400).json({ error: 'Class and Subclass Required' });

    const check = await pool.query(
        "SELECT 1 FROM sub_classes WHERE id = $1 and class_id = $2",
        [Number(subclass_id), Number(class_id)]
    );
    if (check.rows.length === 0) {
        return res.status(400).json({ error: 'that subclass does not belong to that class' });
    }

    req.session.charDraft.class_id = Number(class_id);
    req.session.charDraft.subclass_id = Number(subclass_id);
    res.json({ ok: true });
}

// GET /api/create_char/step3  -> { rolls } (409 if step 2 wasn't done)
export function getStep3(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft || !draft.subclass_id) return res.status(409).json({ error: 'Start with step 1' });

    draft.rolls = draft.rolls ?? {};
    res.json({ rolls: draft.rolls });
}

// POST /api/create_char/step3   body: { plus2, plus1 }  -> { id } of the new character
export async function step3Submit(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const draft = req.session.charDraft;
    if (!draft || !draft.subclass_id) return res.status(409).json({ error: 'Start with step 1' });

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

    const classResult = await pool.query(`SELECT hitpoint_die FROM classes WHERE id = $1`, [draft.class_id]);
    const hitDie = classResult.rows[0]?.hitpoint_die;
    if (!hitDie) return res.status(400).json({ error: 'Class not found' });

    const baseHealth = Math.floor(Math.random() * hitDie) + 1;
    const conMod = Math.floor(final.con / 2) - 5;
    const maxHp = Math.max(1, baseHealth + conMod);

    const { rows } = await pool.query(
        `INSERT INTO characters
           (user_id, name, race_id, class_id, subclass_id,
            str, dex, con, "int", wis, cha, luc, spd, plus2_stat, plus1_stat, max_hp, current_hp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [req.session.userId, draft.name, draft.race_id, draft.class_id, draft.subclass_id,
         final.str, final.dex, final.con, final.int, final.wis, final.cha, final.luc, final.spd,
         plus2, plus1, maxHp, maxHp]
    );
    delete req.session.charDraft; // the draft is saved, so throw it away
    res.json({ id: rows[0].id });
}
