// Character sheet routes (load, hp, delete, equip/unequip) as JSON for React. Queries live in models/.
import * as Characters from '../models/characterModel.js';
import * as Inventory from '../models/inventoryModel.js';
import { getLearnedSpells, getClassSlots } from '../models/spellModel.js';

const { ownsCharacter } = Characters;


// ---------- character sheet ----------

// GET /api/characters/:id
export async function getCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });

    const character = await Characters.getSheetCharacter(req.params.id, req.session.userId);
    if (!character) return res.status(404).json({ error: 'Character...What character?' });

    const charId = character.id;
    character.spell_slots = await getClassSlots(character.class_id, character.level, character.subclass_id);
    const ownedArmor = await Inventory.getOwnedArmor(charId);
    const ownedWeapons = await Inventory.getOwnedWeapons(charId);
    const ownedItems = await Inventory.getOwnedItems(charId);
    const learnedSpells = await getLearnedSpells(charId);
    const actionFeatures = await Characters.getActionFeatures(character.class_id, character.subclass_id, character.level, character.race_id);
    res.json({ character, ownedArmor, ownedWeapons, ownedItems, learnedSpells, actionFeatures });
}

// POST /api/characters/:id/inventory/item/equip   body: { item_id }
export async function equipItem(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const result = await Inventory.equipItem(charId, Number(req.body.item_id));
    if (result === 'not_owned') return res.status(404).json({ error: 'Item not owned' });
    if (result === 'not_equippable') return res.status(400).json({ error: 'Only magical items can be equipped' });
    if (result === 'full') return res.status(400).json({ error: `All ${Inventory.ITEM_SLOTS} item slots are full. Unequip one first.` });
    res.json({ ownedItems: await Inventory.getOwnedItems(charId) });
}

// POST /api/characters/:id/inventory/item/unequip   body: { item_id }
export async function unequipItem(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await Inventory.unequipItem(charId, Number(req.body.item_id));
    res.json({ ownedItems: await Inventory.getOwnedItems(charId) });
}

// PATCH /api/characters/:id/state   body: any of { used_slots, embers_spent, cracks, rest_uses, conditions, exhaustion }
const isCountMap = (o) => o && typeof o === 'object' && !Array.isArray(o) && Object.values(o).every((v) => Number.isInteger(v) && v >= 0);
const isFlagMap = (o) => o && typeof o === 'object' && !Array.isArray(o) && Object.values(o).every((v) => typeof v === 'boolean');
export async function updateSheetState(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const b = req.body || {};
    const checks = {
        used_slots: isCountMap,
        embers_spent: (v) => Number.isInteger(v) && v >= 0,
        cracks: (v) => Number.isInteger(v) && v >= 0 && v <= 10,
        rest_uses: isCountMap,
        conditions: isFlagMap,
        exhaustion: (v) => Number.isInteger(v) && v >= 0 && v <= 10,
    };
    const patch = {};
    for (const [field, ok] of Object.entries(checks)) {
        if (!(field in b)) continue;
        if (!ok(b[field])) return res.status(400).json({ error: `Bad ${field}` });
        patch[field] = b[field];
    }
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to save' });
    const state = await Characters.updateSheetState(Number(req.params.id), req.session.userId, patch);
    if (!state) return res.status(404).json({ error: 'Character not found' });
    res.json(state);
}

// PATCH /api/characters/:id/hp   body: { action: 'heal' | 'damage', amount }
export async function updateHp(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const amount = Number(req.body.amount);
    const change = req.body.action === 'heal' ? amount : -amount;
    if (!Number.isInteger(amount) || amount < 0) return res.status(400).json({ error: 'Bad amount' });

    const hp = await Characters.changeHp(req.params.id, req.session.userId, change);
    if (!hp) return res.status(404).json({ error: 'Character not found' });
    res.json(hp);
}

// PATCH /api/characters/:id/temp-hp   body: { amount } (doesn't stack: keeps the higher) or { clear: true }
export async function updateTempHp(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const clear = req.body.clear === true;
    const amount = clear ? 0 : Number(req.body.amount);
    if (!Number.isInteger(amount) || amount < 0) return res.status(400).json({ error: 'Bad amount' });

    const row = await Characters.setTempHp(req.params.id, req.session.userId, amount, clear);
    if (!row) return res.status(404).json({ error: 'Character not found' });
    res.json(row);
}

// DELETE /api/characters/:id
export async function deleteCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const rowCount = await Characters.deleteCharacter(req.params.id, req.session.userId);
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

    const owned = await Inventory.equipArmor(charId, armorId);
    if (!owned) return res.status(404).json({ error: 'Armor not owned' });
    res.json({ ownedArmor: await Inventory.getOwnedArmor(charId) });
}

// POST /api/characters/:id/inventory/armor/unequip   body: { armor_id }
export async function unequipArmor(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await Inventory.unequipArmor(charId, Number(req.body.armor_id));
    res.json({ ownedArmor: await Inventory.getOwnedArmor(charId) });
}

// POST /api/characters/:id/inventory/weapon/equip   body: { weapon_id }
export async function equipWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const rowCount = await Inventory.equipWeapon(charId, Number(req.body.weapon_id));
    if (!rowCount) return res.status(404).json({ error: 'Weapon not owned' });
    res.json({ ownedWeapons: await Inventory.getOwnedWeapons(charId) });
}

// POST /api/characters/:id/inventory/weapon/dual-wield   body: { weapon_id, dual_wield }
export async function dualWieldWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const rowCount = await Inventory.setWeaponDualWield(charId, Number(req.body.weapon_id), req.body.dual_wield === true);
    if (!rowCount) return res.status(400).json({ error: 'Only an owned one-handed weapon can be dual wielded' });
    res.json({ ownedWeapons: await Inventory.getOwnedWeapons(charId) });
}

// POST /api/characters/:id/inventory/weapon/two-hands   body: { weapon_id, two_handed }
export async function twoHandWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const rowCount = await Inventory.setWeaponTwoHanded(charId, Number(req.body.weapon_id), req.body.two_handed === true);
    if (!rowCount) return res.status(400).json({ error: 'Only an owned versatile weapon can be used in two hands' });
    res.json({ ownedWeapons: await Inventory.getOwnedWeapons(charId) });
}

// POST /api/characters/:id/inventory/weapon/soul-brand   body: { weapon_id, soul_branded }
export async function soulBrandWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const result = await Inventory.setWeaponSoulBrand(charId, Number(req.body.weapon_id), req.body.soul_branded === true);
    if (result === 'not-reaver') return res.status(403).json({ error: 'Only a Reaver can soul brand a weapon' });
    if (result === 'not-owned') return res.status(404).json({ error: 'Weapon not owned' });
    res.json({ ownedWeapons: await Inventory.getOwnedWeapons(charId) });
}

// POST /api/characters/:id/inventory/weapon/sigil-mark   body: { weapon_id, marked }
export async function sigilMarkWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    const result = await Inventory.setWeaponSigilMark(charId, Number(req.body.weapon_id), req.body.marked === true);
    if (result === 'not-wraith') return res.status(403).json({ error: 'Only a Wraith can place a sigil mark' });
    if (result === 'not-owned') return res.status(404).json({ error: 'Weapon not owned' });
    res.json({ ownedWeapons: await Inventory.getOwnedWeapons(charId) });
}

// POST /api/characters/:id/inventory/weapon/unequip   body: { weapon_id }
export async function unequipWeapon(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }

    await Inventory.unequipWeapon(charId, Number(req.body.weapon_id));
    res.json({ ownedWeapons: await Inventory.getOwnedWeapons(charId) });
}
