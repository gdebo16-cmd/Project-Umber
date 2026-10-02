import pool from '../db.js';

export async function charCreate(req, res) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const races = await pool.query("SELECT id, name, traits, img_url FROM races ORDER BY name");
        
    
        res.render("create_char", { races: races.rows });

    } catch (err) {
        console.error(err);
        res.status(500).send("could not load character creation");
    };
};

export async function charCreateStep1(req, res) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    const { name, race_id } = req.body;

    if (!name || !race_id) {
        return res.status(400).send("Name and Race Select Required");
    }

    //draft locker code 
    req.session.charDraft = {
        name: name.trim(),
        race_id: Number(race_id),
    };

    res.redirect("/create_char/step2");
};

export async function charCreateStep2 (req, res) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    if(!req.session.charDraft) {
        return res.redirect("/create_char");
    }
    
    try {
        const classes = await pool.query("SELECT id, name, primary_stat, hitpoint_die, img_url, description FROM classes ORDER BY name");
        res.render("create_char_step2", { classes: classes.rows });
    
    } catch (err) {
        console.error(err);
        res.status(500).send("Could not load Character Creation");
    }
};

export async function charCreateStep2Submit(req, res) {
    if(!req.session.userId) {
        return res.redirect("/login");
    }
    if (!req.session.charDraft) {
        return res.redirect("/create_char");
    }

    const { class_id, subclass_id } = req.body;

    if (!class_id || !subclass_id) {
        return res.status(400).send("Class and SubclassRequired");
    }

    try{
        const check = await pool.query(
            "SELECT 1 FROM sub_classes WHERE id = $1 and class_id = $2",
            [Number(subclass_id), Number(class_id)]
        );
        if (check.rows.length === 0) {
            return res.status(400).send("that subclass does not belong to that class");
        }

        req.session.charDraft.class_id = Number(class_id);
        req.session.charDraft.subclass_id = Number(subclass_id);
        res.redirect("/create_char/step3");

    } catch (err) {
        console.error(err);
        res.status(500).send("could not check subclass");
    };
};

export async function selectSubclass(req, res) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not Logged In' });
    }

    try {
        const result = await pool.query(
            "SELECT id, name, img_url, description FROM sub_classes WHERE class_id = $1 ORDER BY name",
            [Number(req.params.classId)]
        );
        res.json(result.rows);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Could not load subclasses'});
    }
};


const STATS = ["str", "dex", "con", "int", "wis", "cha", "luc", "spd"];

function rollStatValue(){
    const dice =[1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
    dice.sort((a, b) => a - b);
    return dice[1] + dice[2] + dice[3];
};  

export async function charCreateStep3 (req, res) {
    if (!req.session.userId) {
            return res.redirect("/login");
    }
    const draft = req.session.charDraft;
    if(!draft || !draft.subclass_id) {
        return res.redirect("/create_char");
    }
        draft.rolls = draft.rolls ?? {};
        res.render("create_char_step3", { rolls: draft.rolls });
};

export function rollStat(req, res) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not Logged In" });
    }
    const draft = req.session.charDraft;
    if(!draft) return res.status(400).json({ error: "No Character in progress" });
    
    const stat = req.params.stat;
    if(!STATS.includes(stat)) return res.status(400).json({ error: "Invalid Stat" });

    draft.rolls = draft.rolls ?? {};
        if (draft.rolls[stat] === undefined) {       // only roll the first time
            draft.rolls[stat] = rollStatValue();
        }
        res.json({ stat, value: draft.rolls[stat] });
            
};

export async function charCreateStep3Submit(req, res) {
    if (!req.session.userId) return res.redirect("/login");
    const draft = req.session.charDraft;

    if (!draft || !draft.subclass_id) return res.redirect("/create_char");

    const { plus2, plus1 } = req.body;
    if (!STATS.includes(plus2) || !STATS.includes(plus1)) {
        return res.status(400).send("Pick a +2 and a +1 stat");
    }

    if (plus2 === plus1) {
        return res.status(400).send("The +2 and +1 must go to different stats");
    }
    
    const rolls = draft.rolls ?? {};
    if (!STATS.every(s => rolls[s] !== undefined)) {
        return res.status(400).send("Roll every stat first");
    }
    const final = { ...rolls };   // copy the rolls, then add the bonuses
    final[plus2] += 2;
    final[plus1] += 1;
    try {
        await pool.query(
            `INSERT INTO characters
               (user_id, name, race_id, class_id, subclass_id,
                str, dex, con, "int", wis, cha, luc, spd, plus2_stat, plus1_stat)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
            [req.session.userId, draft.name, draft.race_id, draft.class_id, draft.subclass_id,
             final.str, final.dex, final.con, final.int, final.wis, final.cha, final.luc, final.spd,
             plus2, plus1]
            );
            delete req.session.charDraft;   // the draft is saved, so throw it away
            res.redirect("/home");
        } catch (err) {
            console.error(err);
            res.status(500).send("Could not save character");
        }
    }

    export async function showCharacter(req, res) {
        if (!req.session.userId) return res.redirect("/login");

        const { rows } = await pool.query(
            `SELECT ch.*, r.name AS race_name, cl.name AS class_name, s.name AS subclass_name 
            FROM characters ch
            LEFT JOIN races r ON r.id = ch.race_id
            LEFT JOIN classes cl ON cl.id = ch.class_id
            LEFT JOIN sub_classes s ON s.id = ch.subclass_id
            WHERE ch.id = $1 AND ch.user_id = $2`,
            [req.params.id, req.session.userId]
        );

        if (rows.length === 0) return res.status(404).send('Character not found');
        res.render('character', { character: rows[0] });
    };