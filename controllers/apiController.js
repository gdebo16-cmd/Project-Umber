import pool from "../db.js";

// ---------- helpers ----------

// true if this character belongs to the logged-in user
async function ownsCharacter(charId, userId) {
    const { rows } = await pool.query(
        `SELECT id FROM characters WHERE id = $1 AND user_id = $2`,
        [charId, userId]
    );
    return rows.length > 0;
}

async function loadOwnedArmor(charId) {
    const { rows } = await pool.query(
        `SELECT ca.armor_id AS id, ca.is_equipped, a.name, a.armor_type, a.ac_bonus
        FROM character_armor ca
        JOIN armor a ON a.id = ca.armor_id
        WHERE ca.character_id = $1
        ORDER BY a.name`,
        [charId]
    );
    return rows;
}

async function loadOwnedWeapons(charId) {
    const { rows } = await pool.query(
        `SELECT w.id, w.name, w.category, w.damage_dice, cw.is_equipped
        FROM character_weapons cw
        JOIN weapons w ON w.id = cw.weapon_id
        WHERE cw.character_id = $1
        ORDER BY w.name`,
        [charId]
    );
    return rows;
}

async function loadLearnedSpells(charId) {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.base_level, cs.is_learned, cs.is_prepared
        FROM character_spells cs
        JOIN spells s ON s.id = cs.spell_id
        WHERE cs.character_id = $1 AND cs.is_learned
        ORDER BY s.base_level`,
        [charId]
    );
    return rows;
}
// ---------- character sheet ----------

// GET /api/characters/:id
export async function getCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'You aint logged in, fool!' });

    const { rows } = await pool.query(
        `SELECT ch.*, r.name AS race_name, cl.name AS class_name, cl.hitpoint_die, s.name AS subclass_name
        FROM characters ch
        LEFT JOIN races r ON r.id = ch.race_id
        LEFT JOIN classes cl ON cl.id = ch.class_id
        LEFT JOIN sub_classes s ON s.id = ch.subclass_id
        WHERE ch.id = $1 AND ch.user_id = $2`,
        [req.params.id, req.session.userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Character...What character?' });

    const charId = rows[0].id;
    const ownedArmor = await loadOwnedArmor(charId);
    const ownedWeapons = await loadOwnedWeapons(charId);
    const learnedSpells = await loadLearnedSpells(charId);
    res.json({ character: rows[0], ownedArmor, ownedWeapons, learnedSpells });
}

// PATCH /api/characters/:id/hp   body: { action: 'heal' | 'damage', amount }
export async function updateHp(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const amount = Number(req.body.amount);
    const change = req.body.action === 'heal' ? amount : -amount;
    if (!Number.isInteger(amount) || amount < 0) return res.status(400).json({ error: 'Bad amount' });

    const { rows } = await pool.query(
        `UPDATE characters
         SET current_hp = LEAST(max_hp, GREATEST(0, current_hp + $1))
         WHERE id = $2 AND user_id = $3
         RETURNING current_hp, max_hp`,
        [change, req.params.id, req.session.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Character not found' });
    res.json(rows[0]);
}

// DELETE /api/characters/:id
export async function deleteCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const { rowCount } = await pool.query(
        `DELETE FROM characters WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.session.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Character not found' });
    res.json({ ok: true });
}

// ---------- equip / unequip (Inventory tab on the sheet) ----------
// Each one answers with the fresh owned list so React can just swap it in.

// POST /api/characters/:id/inventory/armor/equip   body: { armor_id }
// Only one body armor and one shield can be equipped at a time.
export async function equipArmor(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const armorId = Number(req.body.armor_id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: item } = await client.query(
            `SELECT a.armor_type FROM character_armor ca
            JOIN armor a ON a.id = ca.armor_id
            WHERE ca.character_id = $1 AND ca.armor_id = $2`,
            [charId, armorId]
        );
        if (!item.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Armor not owned' });
        }
        const isShield = item[0].armor_type === 'shield';
        // take off whatever is in the same slot (shield or body armor)...
        await client.query(
            `UPDATE character_armor ca SET is_equipped = false
            FROM armor a WHERE ca.armor_id = a.id AND ca.character_id = $1
            AND (a.armor_type = 'shield') = $2`,
            [charId, isShield]
        );
        // ...then put this one on
        await client.query(
            `UPDATE character_armor SET is_equipped = true
            WHERE character_id = $1 AND armor_id = $2`,
            [charId, armorId]
        );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

    res.json({ ownedArmor: await loadOwnedArmor(charId) });
}

// POST /api/characters/:id/inventory/armor/unequip   body: { armor_id }
export async function unequipArmor(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `UPDATE character_armor SET is_equipped = false WHERE character_id = $1 AND armor_id = $2`,
        [charId, Number(req.body.armor_id)]
    );
    res.json({ ownedArmor: await loadOwnedArmor(charId) });
}

// POST /api/characters/:id/inventory/weapon/equip   body: { weapon_id }
export async function equipWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const { rowCount } = await pool.query(
        `UPDATE character_weapons SET is_equipped = true
         WHERE character_id = $1 AND weapon_id = $2`,
        [charId, Number(req.body.weapon_id)]
    );
    if (!rowCount) return res.status(404).json({ error: 'Weapon not owned' });
    res.json({ ownedWeapons: await loadOwnedWeapons(charId) });
}

// POST /api/characters/:id/inventory/weapon/unequip   body: { weapon_id }
export async function unequipWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await pool.query(
        `UPDATE character_weapons SET is_equipped = false WHERE character_id = $1 AND weapon_id = $2`,
        [charId, Number(req.body.weapon_id)]
    );
    res.json({ ownedWeapons: await loadOwnedWeapons(charId) });
}
