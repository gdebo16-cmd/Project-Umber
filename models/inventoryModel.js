// Armor and weapon database reads and writes: catalog, owned items, add/remove, equip.
import pool from '../db.js';

// ---------- catalog ----------

export async function listArmor() {
    const { rows } = await pool.query(`SELECT id, name, armor_type, ac_bonus, rarity FROM armor ORDER BY name`);
    return rows;
}

export async function listArmorForCharacter(classId, subclassId, level) {
    
    const { rows } = await pool.query(`SELECT a.* FROM armor a WHERE EXISTS (SELECT 1 FROM class_item_proficiencies p
        WHERE p.class_id = $1 AND (p.subclass_id IS NULL OR p.subclass_id = $2) AND p.min_level <= $3
        AND p.item_kind = 'armor' AND p.match_value = a.armor_type)`,
[classId, subclassId, level]
);
return rows;
}

export async function listWeapons() {
    const { rows } = await pool.query(`SELECT id, name, category, damage_dice, rarity, attack_bonus FROM weapons ORDER BY name`);
    return rows;
}

export async function listWeaponsForCharacter(classId, subclassId, level) {
    const { rows } = await pool.query(`SELECT w.* FROM weapons w WHERE EXISTS (SELECT 1 FROM class_item_proficiencies p
        WHERE p.class_id = $1 AND (p.subclass_id IS NULL OR p.subclass_id = $2) AND p.min_level <= $3
        AND p.item_kind = 'weapon'
         AND ((p.match_field = 'weapon_type' AND p.match_value = w.weapon_type)
         OR (p.match_field = 'category' AND p.match_value = w.category)
         OR (p.match_field = 'name' AND p.match_value = w.name)))`,
[classId, subclassId, level]
);
return rows;
}

// Starting gear for character creation: same proficiency filter as above,
// but only common, non-unique items (no +1s or named weapons).
export async function listStartingGear(classId, subclassId, level) {
    const armor = (await listArmorForCharacter(classId, subclassId, level))
        .filter((a) => (a.rarity ?? 'common') === 'common');
    const weapons = (await listWeaponsForCharacter(classId, subclassId, level))
        .filter((w) => (w.rarity ?? 'common') === 'common' && !w.is_unique);
    const byName = (x, y) => x.name.localeCompare(y.name);
    return { armor: armor.sort(byName), weapons: weapons.sort(byName) };
}

// ---------- owned items ----------

export async function getOwnedArmor(charId) {
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

export async function getOwnedWeapons(charId) {
    const { rows } = await pool.query(
        `SELECT w.id, w.name, w.category, w.damage_dice, w.sigil_weapon, cw.is_equipped
        FROM character_weapons cw
        JOIN weapons w ON w.id = cw.weapon_id
        WHERE cw.character_id = $1
        ORDER BY w.name`,
        [charId]
    );
    return rows;
}

// ids of the armor and weapons this character owns
export async function getOwnedIds(charId) {
    const armor = await pool.query(`SELECT armor_id FROM character_armor WHERE character_id = $1`, [charId]);
    const weapons = await pool.query(`SELECT weapon_id FROM character_weapons WHERE character_id = $1`, [charId]);
    return {
        ownedArmorIds: armor.rows.map((r) => Number(r.armor_id)),
        ownedWeaponIds: weapons.rows.map((w) => Number(w.weapon_id)),
    };
}

// ---------- add / remove ----------

export async function addArmor(charId, armorId) {
    await pool.query(
        `INSERT INTO character_armor (character_id, armor_id) VALUES ($1, $2)`,
        [charId, armorId]
    );
}

export async function addWeapon(charId, weaponId) {
    await pool.query(
        `INSERT INTO character_weapons (character_id, weapon_id) VALUES ($1, $2)`,
        [charId, weaponId]
    );
}

export async function removeArmor(charId, armorId) {
    await pool.query(
        `DELETE FROM character_armor WHERE character_id = $1 AND armor_id = $2`,
        [charId, armorId]
    );
}

export async function removeWeapon(charId, weaponId) {
    await pool.query(
        `DELETE FROM character_weapons WHERE character_id = $1 AND weapon_id = $2`,
        [charId, weaponId]
    );
}

// ---------- equip / unequip ----------

// Only one body armor and one shield at a time. Runs in one transaction.
// Returns false if the character doesn't own that armor.
export async function equipArmor(charId, armorId) {
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
            return false;
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
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function unequipArmor(charId, armorId) {
    await pool.query(
        `UPDATE character_armor SET is_equipped = false WHERE character_id = $1 AND armor_id = $2`,
        [charId, armorId]
    );
}

// Returns rows changed (0 = not owned)
export async function equipWeapon(charId, weaponId) {
    const { rowCount } = await pool.query(
        `UPDATE character_weapons SET is_equipped = true
         WHERE character_id = $1 AND weapon_id = $2`,
        [charId, weaponId]
    );
    return rowCount;
}

export async function unequipWeapon(charId, weaponId) {
    await pool.query(
        `UPDATE character_weapons SET is_equipped = false WHERE character_id = $1 AND weapon_id = $2`,
        [charId, weaponId]
    );
}
