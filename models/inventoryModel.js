// Armor and weapon database reads and writes: catalog, owned items, add/remove, equip.
import pool from '../db.js';
import { itemRunesJson } from './runeModel.js';

// ---------- catalog ----------

export async function listArmor() {
    const { rows } = await pool.query(`SELECT id, name, armor_type, armor_type AS armor_category, ac_bonus, rarity FROM armor ORDER BY name`);
    return rows;
}

export async function listArmorForCharacter(classId, subclassId, level) {
    
    const { rows } = await pool.query(`SELECT a.*, a.armor_type AS armor_category FROM armor a WHERE EXISTS (SELECT 1 FROM class_item_proficiencies p
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
    const { rows } = await pool.query(`SELECT w.*, (SELECT wc.name FROM weapon_category wc WHERE wc.id = w.category_id) AS weapon_category
        FROM weapons w WHERE EXISTS (SELECT 1 FROM class_item_proficiencies p
        WHERE p.class_id = $1 AND (p.subclass_id IS NULL OR p.subclass_id = $2) AND p.min_level <= $3
        AND p.item_kind = 'weapon'
         AND p.match_field = 'weapon_category'
         AND p.match_value = (SELECT wc.code FROM weapon_category wc WHERE wc.id = w.category_id))`,
[classId, subclassId, level]
);
return rows;
}

// Starting gear for character creation: same proficiency filter as above,
// but only common, non-unique items (no +1s or named weapons).
export async function listStartingGear(classId, subclassId, level) {
    const armor = (await listArmorForCharacter(classId, subclassId, level))
        .filter((a) => (a.rarity ?? 'common').toLowerCase() === 'common');
    const weapons = (await listWeaponsForCharacter(classId, subclassId, level))
        .filter((w) => (w.rarity ?? 'common').toLowerCase() === 'common' && !w.is_unique);
    const byName = (x, y) => x.name.localeCompare(y.name);
    return { armor: armor.sort(byName), weapons: weapons.sort(byName) };
}

// ---------- owned items ----------

export async function getOwnedArmor(charId) {
    const { rows } = await pool.query(
        `SELECT ca.armor_id AS id, ca.id AS owned_id, ca.is_equipped, a.name, a.armor_type, a.ac_bonus, a.con_cap, a.stealth_disadvantage, /*prep-done*/
                ${itemRunesJson('character_armor_id', 'ca.id')} AS runes
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
        `SELECT w.id, w.name, w.category, w.damage_dice, w.sigil_weapon, w.properties, w.description, w.rarity, w.damage_type, w.attack_bonus, w.range_normal, w.range_long,
                (SELECT wc.name FROM weapon_category wc WHERE wc.id = w.category_id) AS weapon_category, cw.id AS owned_id, cw.is_equipped, cw.dual_wield, cw.two_handed, w.versatile_dice, cw.soul_branded,
                EXISTS (SELECT 1 FROM characters c WHERE c.id = cw.character_id AND c.sigil_item_id = cw.id) AS sigil_marked,
                EXISTS (SELECT 1 FROM characters c WHERE c.id = cw.character_id AND c.runed_weapon_item_id = cw.id) AS is_runed,
                ${itemRunesJson('character_weapon_id', 'cw.id')} AS runes
        FROM character_weapons cw
        JOIN weapons w ON w.id = cw.weapon_id
        WHERE cw.character_id = $1
        ORDER BY w.name`,
        [charId]
    );
    return rows;
}

// every item (potions, scrolls, magical and common items); scrolls carry their linked spell name
export async function listItems() {
    const { rows } = await pool.query(`SELECT i.*, s.name AS spell_name FROM items i
        LEFT JOIN spells s ON s.id = i.spell_id
        ORDER BY i.item_category, i.item_subtype NULLS FIRST, i.name`);
    return rows;
}

// ids of the armor, weapons and items this character owns
export async function getOwnedIds(charId) {
    const armor = await pool.query(`SELECT armor_id FROM character_armor WHERE character_id = $1`, [charId]);
    const weapons = await pool.query(`SELECT weapon_id FROM character_weapons WHERE character_id = $1`, [charId]);
    const items = await pool.query(`SELECT item_id FROM character_items WHERE character_id = $1`, [charId]);
    return {
        ownedArmorIds: armor.rows.map((r) => Number(r.armor_id)),
        ownedWeaponIds: weapons.rows.map((w) => Number(w.weapon_id)),
        ownedItemIds: items.rows.map((i) => Number(i.item_id)),
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

// one row per item; adding one you already own is a no-op (quantity stays as is)
export async function addItem(charId, itemId) {
    await pool.query(
        `INSERT INTO character_items (character_id, item_id) VALUES ($1, $2) ON CONFLICT (character_id, item_id) DO NOTHING`,
        [charId, itemId]
    );
}

export async function removeItem(charId, itemId) {
    await pool.query(
        `DELETE FROM character_items WHERE character_id = $1 AND item_id = $2`,
        [charId, itemId]
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

// Dual wield toggle (Actions tab). Two-handed weapons can't be dual wielded. Returns rows changed.
export async function setWeaponDualWield(charId, weaponId, on) {
    const { rowCount } = await pool.query(
        `UPDATE character_weapons cw SET dual_wield = $3, two_handed = (cw.two_handed AND NOT $3)
         FROM weapons w
         WHERE w.id = cw.weapon_id AND cw.character_id = $1 AND cw.weapon_id = $2
           AND ($3 = false OR NOT ('two-handed' = ANY(w.properties)))`,
        [charId, weaponId, !!on]
    );
    return rowCount;
}

// Two hands toggle (Actions tab). Only versatile weapons with a versatile die; clears dual wield. Returns rows changed.
export async function setWeaponTwoHanded(charId, weaponId, on) {
    const { rowCount } = await pool.query(
        `UPDATE character_weapons cw SET two_handed = $3, dual_wield = (cw.dual_wield AND NOT $3)
         FROM weapons w
         WHERE w.id = cw.weapon_id AND cw.character_id = $1 AND cw.weapon_id = $2
           AND ($3 = false OR w.versatile_dice IS NOT NULL)`,
        [charId, weaponId, !!on]
    );
    return rowCount;
}

// Soul Brand (Soul Smith only): one branded weapon per character, so branding one clears the others.
// Returns 'not-soul-smith', 'not-owned' or 'ok'.
export async function setWeaponSoulBrand(charId, weaponId, on) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: [ch] } = await client.query(
            `SELECT c.name AS class_name FROM characters ch JOIN classes c ON c.id = ch.class_id WHERE ch.id = $1`, [charId]);
        if (ch?.class_name !== 'Soul Smith') { await client.query('ROLLBACK'); return 'not-soul-smith'; }
        if (on) await client.query(`UPDATE character_weapons SET soul_branded = false WHERE character_id = $1 AND weapon_id <> $2`, [charId, weaponId]);
        const { rowCount } = await client.query(
            `UPDATE character_weapons SET soul_branded = $3 WHERE character_id = $1 AND weapon_id = $2`, [charId, weaponId, !!on]);
        if (!rowCount) { await client.query('ROLLBACK'); return 'not-owned'; }
        await client.query('COMMIT');
        return 'ok';
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// Sigil mark (Gracewraith only): one marked weapon, stored as characters.sigil_item_id.
// Returns 'not-gracewraith', 'not-owned' or 'ok'.
export async function setWeaponSigilMark(charId, weaponId, on) {
    const { rows: [ch] } = await pool.query(
        `SELECT c.name AS class_name FROM characters ch JOIN classes c ON c.id = ch.class_id WHERE ch.id = $1`, [charId]);
    if (ch?.class_name !== 'Gracewraith') return 'not-gracewraith';
    const { rows: [row] } = await pool.query(
        `SELECT id FROM character_weapons WHERE character_id = $1 AND weapon_id = $2`, [charId, weaponId]);
    if (!row) return 'not-owned';
    await pool.query(
        `UPDATE characters SET sigil_item_id = CASE WHEN $2 THEN $3::int WHEN sigil_item_id = $3 THEN NULL ELSE sigil_item_id END WHERE id = $1`,
        [charId, !!on, row.id]);
    return 'ok';
}

export async function unequipWeapon(charId, weaponId) {
    await pool.query(
        `UPDATE character_weapons SET is_equipped = false WHERE character_id = $1 AND weapon_id = $2`,
        [charId, weaponId]
    );
}
