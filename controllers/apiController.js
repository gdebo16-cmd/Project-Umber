// Character sheet routes (load, hp, delete, equip/unequip) as JSON for React. Queries live in models/.
import * as Characters from '../models/characterModel.js';
import * as Inventory from '../models/inventoryModel.js';
import { getLearnedSpells } from '../models/spellModel.js';

const { ownsCharacter } = Characters;

// ---------- character sheet ----------

// GET /api/characters/:id
export async function getCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'You aint logged in, fool!' });

    const character = await Characters.getSheetCharacter(req.params.id, req.session.userId);
    if (!character) return res.status(404).json({ error: 'Character...What character?' });

    const charId = character.id;
    const ownedArmor = await Inventory.getOwnedArmor(charId);
    const ownedWeapons = await Inventory.getOwnedWeapons(charId);
    const learnedSpells = await getLearnedSpells(charId);
    const actionFeatures = await Characters.getActionFeatures(character.class_id, character.subclass_id, character.level, character.race_id);
    res.json({ character, ownedArmor, ownedWeapons, learnedSpells, actionFeatures });
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
