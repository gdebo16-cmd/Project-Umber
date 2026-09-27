import { Router } from 'express';
import pool from '../db.js';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";



const __filename = fileURLToPath(import.meta.url);  //import of form reader
const __dirname = path.dirname(__filename); //import of path reader
const publicDir = path.join(__dirname, "..", "Public"); //Creating a path to join

const router = Router();

    
router.get("/", async(req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const races = await pool.query("SELECT id, name FROM races ORDER BY name");
        
        let raceOptions = races.rows.map(race => `<option value="${race.id}">${race.name}</option>`).join("");
        

        if (!raceOptions) {
                raceOptions = `<option value="" disabled selected>No Races in Database</option>`;
            }
        
        let png = `./${race.name}.png`;
        const filePath = path.join(publicDir, "create_char.html");
        let html = await fs.readFile(filePath, 'utf8');
        html = html.replaceAll('{{raceOptions}}', raceOptions);
        html = html.replaceAll('{{png}}', png);
        res.send(html);
    
    } catch (err) {
        console.error(err);
        res.status(500).send("could not load character creation");
    };
});

router.post("/step1", (req, res) => {
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
});


router.get("/step2", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    if(!req.session.charDraft) {
        return res.redirect("/create_char");
    }
    
    try {
        const classes = await pool.query("SELECT id, name FROM classes ORDER BY name");

        let classOptions = classes.rows.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        
        if (!classOptions) {
            classOptions =  `<option value="" disabled selected>No Classes in Database</option>`;
        }

        const filePath = path.join(publicDir, "create_char_step2.html");
        let html = await fs.readFile(filePath, 'utf8');
        html = html.replaceAll('{{classOptions}}', classOptions);
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send("Could not load Character Creation");
    }
})

router.post("/step2", (req, res) => {
    if(!req.session.userId) {
        return res.redirect("/login");
    }
    if (!req.session.charDraft) {
        return res.redirect("/create_char");
    }

    const { class_id } = req.body;

    if (!class_id) {
        return res.status(400).send("Class Required");
    }

    req.session.charDraft.class_id = {
        class: Number(class_id),
        
    };
    res.redirect("/create_char/step3");
});

export default router;