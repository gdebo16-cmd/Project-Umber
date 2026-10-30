// Rune Weaver: rune catalog, inscribing and removing runes on owned items, and the runed weapon.
// Items are character_weapons rows (kind 'weapon') or character_armor rows (kind 'armor', which covers shields).
// Rune / weapon / armor / calling catalogs come from the content pack (soft refs in DB).
import pool from '../db.js';
import content, { getRole, getCalling } from './content.js';
import { RUNE_WEAVER_NAMES, runesPerItem, activeRunes, WARDING_TYPES, runeFitsItem } from '../utils/runeLimits.js'; /*prep-done*/

function runeById(id) {
    return (content.runes ?? []).find((r) => Number(r.id) === Number(id)) ?? null;
}
function weaponById(id) {
    return (content.weapons ?? []).find((w) => Number(w.id) === Number(id)) ?? null;
}
function armorById(id) {
    return (content.armor ?? []).find((a) => Number(a.id) === Number(id)) ?? null;
}

// the inscriber: must be a Rune Weaver of level 3+
async function getInscriber(db, charId) {
    const { rows: [ch] } = await db.query(
        `SELECT ch.id, ch.level, ch.runed_weapon_item_id, ch.role_id, ch.calling_id
           FROM characters ch WHERE ch.id = $1`, [charId]);
    if (ch) {
        const role = getRole(ch.role_id);
        const calling = getCalling(role, ch.calling_id);
        ch.calling_name = calling?.name ?? null;
    }
    return ch;
}
// Pack renamed Rune Weaver -> Tome of Inscription; keep both names for leftover DB callings.
const isRuneWeaver = (ch) => RUNE_WEAVER_NAMES.includes(ch?.calling_name) && ch.level >= 3;

export async function listRunes() {
    return (content.runes ?? []).slice().sort((a, b) =>
        (Number(a.min_level) - Number(b.min_level)) || String(a.name).localeCompare(String(b.name)));
}

// Catalog + limits for the sheet's rune control
export async function getRuneInfo(charId) {
    const ch = await getInscriber(pool, charId);
    const { rows: [{ used }] } = await pool.query(
        `SELECT COUNT(*)::int AS used FROM item_runes WHERE inscribed_by_character_id = $1`, [charId]);
    return {
        isRuneWeaver: isRuneWeaver(ch),
        level: ch?.level ?? 1,
        perItem: runesPerItem(ch?.level),
        active: activeRunes(ch?.level),
        used,
        runedWeaponItemId: ch?.runed_weapon_item_id ?? null,
        wardingTypes: WARDING_TYPES,
        runes: await listRunes(),
    };
}

// Owned item (by catalog id) -> { rowId, type: weapon|armor|shield, properties }
async function getOwnedItem(db, charId, kind, itemId) {
    if (kind === 'weapon') {
        const { rows: [r] } = await db.query(
            `SELECT cw.id AS row_id FROM character_weapons cw
              WHERE cw.character_id = $1 AND cw.weapon_id = $2`, [charId, itemId]);
        if (!r) return null;
        const w = weaponById(itemId);
        return { rowId: r.row_id, type: 'weapon', properties: w?.properties ?? [] };
    }
    if (kind === 'armor') {
        const { rows: [r] } = await db.query(
            `SELECT ca.id AS row_id FROM character_armor ca
              WHERE ca.character_id = $1 AND ca.armor_id = $2`, [charId, itemId]);
        if (!r) return null;
        const a = armorById(itemId);
        return { rowId: r.row_id, type: a?.armor_type === 'shield' ? 'shield' : 'armor', properties: [] };
    }
    return null;
}

function enrichItemRunes(rows) {
    return (rows ?? []).map((r) => {
        const rune = runeById(r.rune_id);
        return {
            id: r.id,
            rune_id: r.rune_id,
            name: rune?.name ?? null,
            effect: rune?.effect ?? null,
            dice: rune?.dice ?? null,
            is_damage_rider: !!rune?.is_damage_rider,
            choice_value: r.choice_value,
        };
    });
}

// Returns { error, status } or { ok: true, endedOldest }
export async function inscribeRune(charId, { kind, itemId, runeId, choiceValue }) {
    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const fail = async (status, error) => { await db.query('ROLLBACK'); return { status, error }; };
        const ch = await getInscriber(db, charId);
        if (!isRuneWeaver(ch)) return fail(403, 'Only a Rune Weaver (level 3+) can inscribe runes');
        const rune = runeById(runeId);
        if (!rune) return fail(404, 'Unknown rune');
        const item = await getOwnedItem(db, charId, kind, itemId);
        if (!item) return fail(404, 'Item not owned');
        if (!runeFitsItem(rune.item_types, item.type)) return fail(400, `${rune.name} can't go on ${item.type === 'armor' ? 'armor' : `a ${item.type}`} (only ${rune.item_types.join(', ')}; gear runes go on armor or shields)`);
        if (rune.min_level > ch.level) return fail(400, `${rune.name} needs level ${rune.min_level}`);
        if (rune.name === 'Homing Rune' && !item.properties.some((p) => p === 'thrown' || p === 'ammunition')) {
            return fail(400, 'Homing Rune needs a thrown weapon or one that fires ammunition');
        }
        let choice = null;
        if (rune.choice_param === 'damage_type') {
            choice = String(choiceValue || '').toLowerCase();
            if (!WARDING_TYPES.includes(choice)) return fail(400, `Pick a damage type: ${WARDING_TYPES.join(', ')}`);
        }
        const col = kind === 'weapon' ? 'character_weapon_id' : 'character_armor_id';
        const { rows: onItemRaw } = await db.query(
            `SELECT ir.rune_id FROM item_runes ir WHERE ir.${col} = $1`, [item.rowId]);
        const onItem = enrichItemRunes(onItemRaw);
        if (onItem.some((r) => Number(r.rune_id) === Number(rune.id))) return fail(400, `This item already has ${rune.name}`);
        if (onItem.length >= runesPerItem(ch.level)) return fail(400, `At level ${ch.level} an item holds ${runesPerItem(ch.level)} rune(s)`);
        if (rune.is_damage_rider && onItem.some((r) => r.is_damage_rider)) return fail(400, 'Only one damage-rider rune (Ember, Rime, Spark, Gall) per weapon');

        // over the active limit: the oldest rune ends
        let endedOldest = null;
        const { rows: mineRaw } = await db.query(
            `SELECT ir.id, ir.rune_id FROM item_runes ir
              WHERE ir.inscribed_by_character_id = $1 ORDER BY ir.inscribed_at, ir.id`, [charId]);
        const mine = enrichItemRunes(mineRaw).map((r, i) => ({ ...r, id: mineRaw[i].id }));
        const limit = activeRunes(ch.level);
        const overflow = mine.length - limit + 1;
        for (let i = 0; i < overflow; i++) {
            await db.query(`DELETE FROM item_runes WHERE id = $1`, [mine[i].id]);
            endedOldest = mine[i].name;
        }
        await db.query(
            `INSERT INTO item_runes (${col}, rune_id, inscribed_by_character_id, choice_value) VALUES ($1, $2, $3, $4)`,
            [item.rowId, rune.id, charId, choice]);
        await clearRunedWeaponIfBare(db, charId);
        await db.query('COMMIT');
        return { ok: true, endedOldest };
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    } finally {
        db.release();
    }
}

export async function removeRune(charId, itemRuneId) {
    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const ch = await getInscriber(db, charId);
        if (!isRuneWeaver(ch)) { await db.query('ROLLBACK'); return { status: 403, error: 'Only a Rune Weaver can remove runes' }; }
        const { rowCount } = await db.query(
            `DELETE FROM item_runes WHERE id = $1 AND inscribed_by_character_id = $2`, [itemRuneId, charId]);
        if (!rowCount) { await db.query('ROLLBACK'); return { status: 404, error: 'Rune not found' }; }
        await clearRunedWeaponIfBare(db, charId);
        await db.query('COMMIT');
        return { ok: true };
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    } finally {
        db.release();
    }
}

// The runed weapon must carry at least one of your runes
async function clearRunedWeaponIfBare(db, charId) {
    await db.query(
        `UPDATE characters ch SET runed_weapon_item_id = NULL
          WHERE ch.id = $1 AND ch.runed_weapon_item_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM item_runes ir WHERE ir.character_weapon_id = ch.runed_weapon_item_id
                              AND ir.inscribed_by_character_id = ch.id)`, [charId]);
}

// weaponId = catalog id of an owned weapon, or null to clear
export async function setRunedWeapon(charId, weaponId) {
    const ch = await getInscriber(pool, charId);
    if (!isRuneWeaver(ch)) return { status: 403, error: 'Only a Rune Weaver can choose a runed weapon' };
    if (weaponId == null) {
        await pool.query(`UPDATE characters SET runed_weapon_item_id = NULL WHERE id = $1`, [charId]);
        return { ok: true };
    }
    const item = await getOwnedItem(pool, charId, 'weapon', weaponId);
    if (!item) return { status: 404, error: 'Weapon not owned' };
    const { rows: [has] } = await pool.query(
        `SELECT 1 FROM item_runes WHERE character_weapon_id = $1 AND inscribed_by_character_id = $2 LIMIT 1`, [item.rowId, charId]);
    if (!has) return { status: 400, error: 'The runed weapon needs at least one of your runes' };
    await pool.query(`UPDATE characters SET runed_weapon_item_id = $2 WHERE id = $1`, [charId, item.rowId]);
    return { ok: true };
}

// SQL fragment: soft rune refs on one owned item (enrich with pack via enrichOwnedRunes)
export const itemRunesJson = (col, rowExpr) => `COALESCE((SELECT json_agg(json_build_object(
        'id', ir.id, 'rune_id', ir.rune_id, 'choice_value', ir.choice_value) ORDER BY ir.inscribed_at, ir.id)
      FROM item_runes ir WHERE ir.${col} = ${rowExpr}), '[]'::json)`;

export function enrichOwnedRunes(raw) {
    const list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    return enrichItemRunes(list);
}