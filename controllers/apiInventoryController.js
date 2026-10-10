// The "Add Armor & weapons" page (/characters/:id/inventory) as JSON for React.
import pool from "../db.js";

async function ownsCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows.length > 0;
}

// ids of the armor and weapons this character owns
async function loadOwnedIds(charId) {
    const armor = await pool.query(`SELECT armor_id FROM character_armor WHERE character_id = $1`, [charId]);
    const weapons = await pool.query(`SELECT weapon_id FROM character_weapons WHERE character_id = $1`, [charId]);
    return {
        ownedArmorIds: armor.rows.map((r) => Number(r.armor_id)),
        ownedWeaponIds: weapons.rows.map((w) => Number(w.weapon_id)),
    };
}

// GET /api/characters/:id/inventory
export async function getInventory(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);

    const { rows: chars } = await pool.query(
        `SELECT id, name FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, req.session.userId]
    );
    if (!chars.length) return res.status(404).json({ error: 'Character not found' });

    const armor = await pool.query(`SELECT id, name, armor_type, ac_bonus, rarity FROM armor ORDER BY name`);
    const weapons = await pool.query(`SELECT id, name, category, damage_dice, rarity, attack_bonus FROM weapons ORDER BY name`);

    res.json({
        character: chars[0],
        armor: armor.rows,
        weapons: weapons.rows,
        ...(await loadOwnedIds(charId)),
    });
}

// POST /api/characters/:id/inventory/armor   body: { armor_id }
export async function addArmor(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `INSERT INTO character_armor (character_id, armor_id) VALUES ($1, $2)`,
        [charId, Number(req.body.armor_id)]
    );
    res.json(await loadOwnedIds(charId));
}

// POST /api/characters/:id/inventory/weapon   body: { weapon_id }
export async function addWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `INSERT INTO character_weapons (character_id, weapon_id) VALUES ($1, $2)`,
        [charId, Number(req.body.weapon_id)]
    );
    res.json(await loadOwnedIds(charId));
}

// POST /api/characters/:id/inventory/armor/remove   body: { armor_id }
export async function removeArmor(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `DELETE FROM character_armor WHERE character_id = $1 AND armor_id = $2`,
        [charId, Number(req.body.armor_id)]
    );
    res.json(await loadOwnedIds(charId));
}

// POST /api/characters/:id/inventory/weapon/remove   body: { weapon_id }
export async function removeWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `DELETE FROM character_weapons WHERE character_id = $1 AND weapon_id = $2`,
        [charId, Number(req.body.weapon_id)]
    );
    res.json(await loadOwnedIds(charId));
}
