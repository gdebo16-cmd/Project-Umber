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

export async function deleteCharacter(req, res) {
    if (!req.session.userId) return res.redirect('/login');
  
    const charId = req.params.id;
    const userId = req.session.userId;
  
    const { rowCount } = await pool.query(
      `DELETE FROM characters WHERE id = $1 AND user_id = $2`,
      [charId, userId]
    );
    if (!rowCount) return res.status(404).send('Character not found');
  
    res.redirect('/home');
  }

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
        const classResult = await pool.query(
            `SELECT hitpoint_die FROM classes WHERE id = $1`,
            [draft.class_id]
          );
          const hitDie = classResult.rows[0]?.hitpoint_die;
          if (!hitDie) {
            return res.status(400).send('Class not found');
          }
          
          const baseHealth = Math.floor(Math.random() * hitDie) + 1;
          const conMod = Math.floor(final.con / 2) - 5;
          const maxHp = Math.max(1, baseHealth + conMod);
        await pool.query(
            `INSERT INTO characters
               (user_id, name, race_id, class_id, subclass_id,
                str, dex, con, "int", wis, cha, luc, spd, plus2_stat, plus1_stat, max_hp, current_hp)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, $16, $17)`,
            [req.session.userId, draft.name, draft.race_id, draft.class_id, draft.subclass_id,
             final.str, final.dex, final.con, final.int, final.wis, final.cha, final.luc, final.spd,
             plus2, plus1, maxHp, maxHp]
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

        const { rows: ownedArmor } = await pool.query(
            `SELECT a.id, a.name, a.armor_type, a.ac_bonus, ca.is_equipped
             FROM character_armor ca
             JOIN armor a ON a.id = ca.armor_id
             WHERE ca.character_id = $1
             ORDER BY a.name`,
            [rows[0].id]
          );
          
          const { rows: ownedWeapons } = await pool.query(
            `SELECT w.id, w.name, w.category, w.damage_dice, cw.is_equipped
             FROM character_weapons cw
             JOIN weapons w ON w.id = cw.weapon_id
             WHERE cw.character_id = $1
             ORDER BY w.name`,
            [rows[0].id]
          );
          
          res.render('character', {
            character: rows[0],
            ownedArmor,
            ownedWeapons,
            equippedWeapons: ownedWeapons.filter(w => w.is_equipped),
          });
   
    };

    export async function showInventory(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);

        const { rows: chars } = await pool.query(
            `SELECT id, name FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!chars.length) return res.status(404).send('Character not found');

        const armor = await pool.query(`SELECT id, name, armor_type, ac_bonus, rarity FROM armor ORDER BY name`);
        const weapons = await pool.query(`SELECT id, name, category, damage_dice, rarity, attack_bonus FROM weapons ORDER BY name`);

        const ownedArmor = await pool.query(`SELECT armor_id FROM character_armor WHERE character_id = $1`, [charId]);
        const ownedWeapons = await pool.query(`SELECT weapon_id FROM character_weapons WHERE character_id = $1`, [charId]);

        res.render('inventory', { character: chars[0],
            armor: armor.rows,
            weapons: weapons.rows,
            ownedArmorIds: ownedArmor.rows.map(r => Number(r.armor_id)),
            ownedWeaponIds: ownedWeapons.rows.map(w => Number(w.weapon_id)),
        })
    }

    export async function addArmor(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const armorId = Number(req.body.armor_id);

        const { rows: owner } = await pool.query(
            `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!owner.length) return res.status(404).send('Character not found');

        await pool.query(`INSERT INTO character_armor (character_id, armor_id) VALUES ($1, $2)`, 
        [charId, armorId]
        );
        res.redirect(`/characters/${charId}/inventory`);
    }

    export async function addWeapon(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const weaponId = Number(req.body.weapon_id);

        const { rows: owner } = await pool.query(
            `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!owner.length) return res.status(404).send('Character not found');

        await pool.query(`INSERT into character_weapons (character_id, weapon_id) VALUES ($1, $2)`,
            [charId, weaponId]
        );
        res.redirect(`/characters/${charId}/inventory`);
    }

    export async function removeArmor(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const armorId = Number(req.body.armor_id);

        const { rows: owner } = await pool.query(
            `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!owner.length) return res.status(404).send('Character not found');

        await pool.query(
            `DELETE from character_armor
            WHERE character_id = $1 AND armor_id = $2`,
            [charId, armorId]
        );
        res.redirect(`/characters/${charId}/inventory`);
    }

    export async function removeWeapon(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const weaponId = Number(req.body.weapon_id);

        const { rows: owner } = await pool.query(
            `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!owner.length) return res.status(404).send('Character not found');
        
        await pool.query(
            `DELETE from character_weapons
            WHERE character_id = $1 AND weapon_id = $2`,
            [charId, weaponId]
        );
        res.redirect(`/characters/${charId}/inventory`);
    }

    export async function adjustHp(req, res) {
        if (!req.session.userId) return res.redirect('/login');
      
        const amount = Number.parseInt(req.body.amount, 10);
        const dir = req.body.action === 'damage' ? -1
                  : req.body.action === 'heal' ? 1
                  : 0;
        if (!Number.isInteger(amount) || amount < 0 || amount > 9999 || dir === 0) {
          return res.status(400).send('Amount must be a whole number from 0 to 9999');
        }
      
        const { rowCount } = await pool.query(
          `UPDATE characters
              SET current_hp = LEAST(max_hp, GREATEST(0, current_hp + $1))
            WHERE id = $2 AND user_id = $3`,
          [dir * amount, req.params.id, req.session.userId]
        );
        if (!rowCount) return res.status(404).send('Character not found');
      
        res.redirect(`/characters/${req.params.id}`);
      }

    export async function showEditCharacter(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);

        const { rows: chars } = await pool.query(
            `SELECT id, name, race_id, class_id, subclass_id, level, str, dex, con, "int", wis, cha, luc, spd FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!chars.length) return res.status(404).send('Character not found');

        const { rows: races } = await pool.query(
            `SELECT id, name, traits, img_url FROM races ORDER BY name`
        );
        const { rows: classes } = await pool.query(
            `SELECT id, name, primary_stat, hitpoint_die, img_url, description
            FROM classes ORDER BY name`
        );
        const { rows: subClasses } = await pool.query(
            `SELECT id, name, class_id, img_url, description
             FROM sub_classes
             ORDER BY name`
        );
        res.render('charEdit', { character: chars[0], races, classes, subClasses });
    }

    export async function editClass(req, res) {
        if (!req.session.userId) return res.redirect("/login");

        const charId = Number(req.params.id);
        const class_id = Number(req.body.class_id);
        const subclass_id = Number(req.body.subclass_id);

        const { rows: subs } = await pool.query(
            `SELECT class_id FROM sub_classes WHERE id = $1`,
            [subclass_id]
        );
        if (!subs.length || Number(subs[0].class_id) !== class_id) {
            return res.status(400).send("Subclass does not match class");
        }

        await pool.query(
            `UPDATE characters
             SET class_id = $1, subclass_id = $2
             WHERE id = $3 AND user_id = $4`,
            [class_id, subclass_id, charId, req.session.userId]
        );
        res.redirect(`/characters/${charId}/edit`);
    }

    export async function editLevel(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const level = Number(req.body.level);
        if (!Number.isInteger(level) || level < 1 || level > 30) {
            return res.status(400).send("Level must be an integer from 1 to 30");
        }
        await pool.query(
            `UPDATE characters SET level = $1 WHERE id = $2 AND user_id = $3`,
            [level, charId, req.session.userId]
        );
        res.redirect(`/characters/${charId}/edit`);
    }

    export async function editAbilities(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const { str, dex, con, int, wis, cha, luc, spd } = req.body;

        const vals = [str, dex, con, int, wis, cha, luc, spd].map((v) => Number(v));
        if (vals.some((v) => !Number.isInteger(v) || v < 3 || v > 18)) {
            return res.status(400).send("Ability scores must be integers from 3 to 18");
        }

        await pool.query(
            `UPDATE characters SET str = $1, dex = $2, con = $3, "int" = $4, wis = $5, cha = $6, luc = $7, spd = $8 WHERE id = $9 AND user_id = $10`,
            [...vals, charId, req.session.userId]
        );
        res.redirect(`/characters/${charId}/edit`);
    }

    export async function editNameAndRace(req, res) {
        if (!req.session.userId) return res.redirect("/login");
        const charId = Number(req.params.id);
        const { name, race_id } = req.body;
        if (!name) return res.status(400).send("Name is required");
        if (!race_id) return res.status(400).send("Race is required");
        await pool.query(
            `UPDATE characters SET name = $1, race_id = $2 WHERE id = $3 AND user_id = $4`,
            [name, race_id, charId, req.session.userId]
        );
        res.redirect(`/characters/${charId}/edit`);
    }

    export async function equipArmor(req, res) {

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: item } = await client.query(
            `SELECT a.armor_type FROM character_armor ca
            JOIN armor a ON a.id = ca.armor_id
            WHERE ca.character_id =$1 AND ca.armor_id =$2`,
            [charId, armorId]
        );
        if (!item.length) {
            await client.query('ROLLBACK');
            return res.status(404).send('Armor not owned');
        }
        const isShield= item[0].armor_type === 'shield';
        await client.query(
            `UPDATE character_armor ca SET is_equipped = false
            FROM armor a WHERE ca.armor_id = a.id AND ca.character_id = $1
            AND (a.armor_type = 'shield') = $2`, [charId, isShield]);
        
            await client.query(
            `UPDATE character_armor ca SET is_equipped = true
            WHERE character_id = $1 AND armor_id = $2`, [charId, armorId]);
            await client.query('COMMIT');
            res.redirect(`/characters/${charId}`);
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); 
    }
};

export async function unequipArmor(req, res) {
    if (!req.session.userId) return res.redirect("/login");
    const charId = Number(req.params.id);
    const armorId = Number(req.body.armor_id);

        const { rows: owner } = await pool.query(
            `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!owner.length) return res.status(404).send('Character not found');

    await pool.query(
        `UPDATE character_armor SET is_equipped = false WHERE character_id = $1 AND armor_id = $2`, [charId, armorId]
    );
    res.redirect(`/characters/${charId}`);
}   

export async function unequipWeapon(req, res) {
    if (!req.session.userId) return res.redirect("/login");
    const charId = Number(req.params.id);
    const weaponId = Number(req.body.weapon_id);

        const { rows: owner } = await pool.query(
            `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
            [charId, req.session.userId]
        );
        if (!owner.length) return res.status(404).send('Character not found');

    await pool.query(
        `UPDATE character_weapons SET is_equipped = false WHERE character_id = $1 AND weapon_id = $2`, [charId, weaponId]
    );
    res.redirect(`/characters/${charId}`);
}


export async function equipWeapon(req, res) {
    const charId = req.params.id;
    const { weapon_id } = req.body;
  
    const { rows: owner } = await pool.query(
      'SELECT 1 FROM characters WHERE id = $1 AND user_id = $2',
      [charId, req.session.userId]);
    if (!owner.length) return res.status(403).send('Not your character');
  
    const { rowCount } = await pool.query(
      `UPDATE character_weapons SET is_equipped = true
       WHERE character_id = $1 AND weapon_id = $2`, [charId, weapon_id]);
    if (!rowCount) return res.status(404).send('Weapon not owned');
  
    res.redirect(`/characters/${charId}`);
  }