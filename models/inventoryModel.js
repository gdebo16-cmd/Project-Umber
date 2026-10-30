// Armor and weapon database reads and writes: catalog, owned items, add/remove, equip.
import pool from '../db.js';
import content, { getRole } from './content.js';
import { spellName } from './spellPack.js';
import { itemRunesJson, enrichOwnedRunes } from './runeModel.js';

// ---------- catalog (content pack) ----------

function armorById(id) {
    return (content.armor ?? []).find((a) => Number(a.id) === Number(id));
}
function weaponById(id) {
    return (content.weapons ?? []).find((w) => Number(w.id) === Number(id));
}
function itemById(id) {
    return (content.items ?? []).find((i) => Number(i.id) === Number(id));
}
function weaponCategoryById(id) {
    return (content.weapon_category ?? []).find((c) => Number(c.id) === Number(id));
}
function profRows(roleId, callingId, level, kind) {
    const rid = Number(roleId);
    const cid = callingId == null || callingId === '' ? null : Number(callingId);
    const lvl = Number(level) || 1;
    return (content.role_item_proficiencies ?? []).filter(
        (p) => Number(p.role_id) === rid
            && (p.calling_id == null || Number(p.calling_id) === cid)
            && Number(p.min_level) <= lvl
            && p.item_kind === kind
    );
}

export async function listArmor() {
    return (content.armor ?? [])
        .map((a) => ({
            id: a.id,
            name: a.name,
            armor_type: a.armor_type,
            armor_category: a.armor_type,
            ac_bonus: a.ac_bonus,
            rarity: a.rarity,
        }))
        .sort((x, y) => String(x.name).localeCompare(String(y.name)));
}

export async function listArmorForCharacter(roleId, callingId, level) {
    const allowed = new Set(profRows(roleId, callingId, level, 'armor').map((p) => String(p.match_value).toLowerCase()));
    return (content.armor ?? [])
        .filter((a) => allowed.has(String(a.armor_type).toLowerCase()))
        .map((a) => ({ ...a, armor_category: a.armor_type }));
}

export async function listWeapons() {
    return (content.weapons ?? [])
        .map((w) => ({
            id: w.id,
            name: w.name,
            category: w.category,
            damage_dice: w.damage_dice,
            rarity: w.rarity,
            attack_bonus: w.attack_bonus,
        }))
        .sort((x, y) => String(x.name).localeCompare(String(y.name)));
}

export async function listWeaponsForCharacter(roleId, callingId, level) {
    const allowed = new Set(profRows(roleId, callingId, level, 'weapon').map((p) => String(p.match_value)));
    return (content.weapons ?? [])
        .filter((w) => {
            const cat = weaponCategoryById(w.category_id);
            return cat && allowed.has(String(cat.code));
        })
        .map((w) => ({
            ...w,
            weapon_category: weaponCategoryById(w.category_id)?.name ?? null,
        }));
}

// Starting gear for character creation: same proficiency filter as above,
// but only common, non-unique items (no +1s or named weapons).
export async function listStartingGear(roleId, callingId, level) {
    const armor = (await listArmorForCharacter(roleId, callingId, level))
        .filter((a) => (a.rarity ?? 'common').toLowerCase() === 'common');
    const weapons = (await listWeaponsForCharacter(roleId, callingId, level))
        .filter((w) => (w.rarity ?? 'common').toLowerCase() === 'common' && !w.is_unique);
    const byName = (x, y) => x.name.localeCompare(y.name);
    return { armor: armor.sort(byName), weapons: weapons.sort(byName) };
}

// ---------- owned items (player rows in DB; details from pack) ----------

export async function getOwnedArmor(charId) {
    const { rows } = await pool.query(
        `SELECT ca.armor_id AS id, ca.id AS owned_id, ca.is_equipped,
                ${itemRunesJson('character_armor_id', 'ca.id')} AS runes
        FROM character_armor ca
        WHERE ca.character_id = $1`,
        [charId]
    );
    return rows
        .map((r) => {
            const a = armorById(r.id);
            if (!a) return null;
            return {
                id: r.id,
                owned_id: r.owned_id,
                is_equipped: r.is_equipped,
                name: a.name,
                armor_type: a.armor_type,
                ac_bonus: a.ac_bonus,
                con_cap: a.con_cap,
                stealth_disadvantage: a.stealth_disadvantage,
                runes: enrichOwnedRunes(r.runes),
            };
        })
        .filter(Boolean)
        .sort((x, y) => String(x.name).localeCompare(String(y.name)));
}

export async function getOwnedWeapons(charId) {
    const { rows } = await pool.query(
        `SELECT cw.weapon_id AS id, cw.id AS owned_id, cw.is_equipped, cw.dual_wield, cw.two_handed, cw.soul_branded,
                EXISTS (SELECT 1 FROM characters c WHERE c.id = cw.character_id AND c.sigil_item_id = cw.id) AS sigil_marked,
                EXISTS (SELECT 1 FROM characters c WHERE c.id = cw.character_id AND c.runed_weapon_item_id = cw.id) AS is_runed,
                ${itemRunesJson('character_weapon_id', 'cw.id')} AS runes
        FROM character_weapons cw
        WHERE cw.character_id = $1`,
        [charId]
    );
    return rows
        .map((r) => {
            const w = weaponById(r.id);
            if (!w) return null;
            return {
                id: r.id,
                name: w.name,
                category: w.category,
                damage_dice: w.damage_dice,
                sigil_weapon: w.sigil_weapon,
                properties: w.properties,
                description: w.description,
                rarity: w.rarity,
                damage_type: w.damage_type,
                attack_bonus: w.attack_bonus,
                range_normal: w.range_normal,
                range_long: w.range_long,
                weapon_category: weaponCategoryById(w.category_id)?.name ?? null,
                owned_id: r.owned_id,
                is_equipped: r.is_equipped,
                dual_wield: r.dual_wield,
                two_handed: r.two_handed,
                versatile_dice: w.versatile_dice,
                soul_branded: r.soul_branded,
                sigil_marked: r.sigil_marked,
                is_runed: r.is_runed,
                runes: enrichOwnedRunes(r.runes),
            };
        })
        .filter(Boolean)
        .sort((x, y) => String(x.name).localeCompare(String(y.name)));
}

// every item (potions, scrolls, magical and common items); scrolls carry their linked spell name
export async function listItems() {
    return (content.items ?? [])
        .slice()
        .sort((a, b) => String(a.item_category).localeCompare(String(b.item_category))
            || String(a.item_subtype ?? '').localeCompare(String(b.item_subtype ?? ''))
            || String(a.name).localeCompare(String(b.name)))
        .map((i) => ({ ...i, spell_name: i.spell_id != null ? spellName(i.spell_id) : null }));
}

// Every item this character carries, with quantity and equipped flag
export async function getOwnedItems(charId) {
    const { rows } = await pool.query(
        `SELECT ci.item_id AS id, ci.id AS owned_id, ci.quantity, ci.is_equipped
        FROM character_items ci
        WHERE ci.character_id = $1`,
        [charId]
    );
    return rows
        .map((r) => {
            const i = itemById(r.id);
            if (!i) return null;
            return {
                id: r.id,
                name: i.name,
                item_category: i.item_category,
                item_subtype: i.item_subtype,
                rarity: i.rarity,
                description: i.description,
                effects: i.effects,
                consumable: i.consumable,
                uses: i.uses,
                recharge: i.recharge,
                weight_lb: i.weight_lb,
                spell_id: i.spell_id,
                owned_id: r.owned_id,
                quantity: r.quantity,
                is_equipped: r.is_equipped,
                spell_name: i.spell_id != null ? spellName(i.spell_id) : null,
            };
        })
        .filter(Boolean)
        .sort((x, y) => String(x.name).localeCompare(String(y.name)));
}

// Magical items (every rarity, Object of Power included) can be equipped, up to ITEM_SLOTS at once.
export const ITEM_SLOTS = 3; // keep in sync with ITEM_SLOTS in client/src/sheet/actions/InventoryTab.jsx

// Returns 'ok', 'not_owned', 'not_equippable' or 'full'
export async function equipItem(charId, itemId) {
    const { rows } = await pool.query(
        `SELECT ci.is_equipped,
                (SELECT count(*)::int FROM character_items x WHERE x.character_id = $1 AND x.is_equipped) AS used
        FROM character_items ci
        WHERE ci.character_id = $1 AND ci.item_id = $2`,
        [charId, itemId]
    );
    if (!rows.length) return 'not_owned';
    const item = itemById(itemId);
    if (!item || item.item_category !== 'magical_item') return 'not_equippable';
    if (rows[0].is_equipped) return 'ok';
    if (rows[0].used >= ITEM_SLOTS) return 'full';
    await pool.query(`UPDATE character_items SET is_equipped = true WHERE character_id = $1 AND item_id = $2`, [charId, itemId]);
    return 'ok';
}

export async function unequipItem(charId, itemId) {
    await pool.query(`UPDATE character_items SET is_equipped = false WHERE character_id = $1 AND item_id = $2`, [charId, itemId]);
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
        `INSERT INTO character_armor (character_id, armor_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [charId, armorId]
    );
}

export async function addWeapon(charId, weaponId) {
    await pool.query(
        `INSERT INTO character_weapons (character_id, weapon_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [charId, weaponId]
    );
}

export async function addItem(charId, itemId) {
    await pool.query(
        `INSERT INTO character_items (character_id, item_id, quantity) VALUES ($1, $2, 1)
         ON CONFLICT (character_id, item_id) DO UPDATE SET quantity = character_items.quantity + 1`,
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
        const { rows: owned } = await client.query(
            `SELECT armor_id FROM character_armor WHERE character_id = $1 AND armor_id = $2`,
            [charId, armorId]
        );
        const a = armorById(armorId);
        if (!owned.length || !a) {
            await client.query('ROLLBACK');
            return false;
        }
        const isShield = a.armor_type === 'shield';
        const { rows: allOwned } = await client.query(
            `SELECT armor_id FROM character_armor WHERE character_id = $1 AND is_equipped`,
            [charId]
        );
        for (const row of allOwned) {
            const other = armorById(row.armor_id);
            if (!other) continue;
            if ((other.armor_type === 'shield') === isShield) {
                await client.query(
                    `UPDATE character_armor SET is_equipped = false WHERE character_id = $1 AND armor_id = $2`,
                    [charId, row.armor_id]
                );
            }
        }
        await client.query(
            `UPDATE character_armor SET is_equipped = true WHERE character_id = $1 AND armor_id = $2`,
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
    const w = weaponById(weaponId);
    if (!w) return 0;
    const props = w.properties ?? [];
    if (on && props.includes('two-handed')) return 0;
    const { rowCount } = await pool.query(
        `UPDATE character_weapons SET dual_wield = $3, two_handed = (two_handed AND NOT $3)
         WHERE character_id = $1 AND weapon_id = $2`,
        [charId, weaponId, !!on]
    );
    return rowCount;
}

// Two hands toggle (Actions tab). Only versatile weapons with a versatile die; clears dual wield. Returns rows changed.
export async function setWeaponTwoHanded(charId, weaponId, on) {
    const w = weaponById(weaponId);
    if (!w) return 0;
    if (on && w.versatile_dice == null) return 0;
    const { rowCount } = await pool.query(
        `UPDATE character_weapons SET two_handed = $3, dual_wield = (dual_wield AND NOT $3)
         WHERE character_id = $1 AND weapon_id = $2`,
        [charId, weaponId, !!on]
    );
    return rowCount;
}

// Soul Brand (Reaver only): one branded weapon per character, so branding one clears the others.
// Returns 'not-reaver', 'not-owned' or 'ok'.
export async function setWeaponSoulBrand(charId, weaponId, on) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: [ch] } = await client.query(
            `SELECT role_id FROM characters WHERE id = $1`, [charId]);
        if (getRole(ch?.role_id)?.name !== 'Reaver') { await client.query('ROLLBACK'); return 'not-reaver'; }
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

// Sigil mark (Wraith only): one marked weapon, stored as characters.sigil_item_id.
// Returns 'not-wraith', 'not-owned' or 'ok'.
export async function setWeaponSigilMark(charId, weaponId, on) {
    const { rows: [ch] } = await pool.query(
        `SELECT role_id FROM characters WHERE id = $1`, [charId]);
    if (getRole(ch?.role_id)?.name !== 'Wraith') return 'not-wraith';
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
