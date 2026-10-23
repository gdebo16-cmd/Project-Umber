// The "Add Armor & weapons" page (/characters/:id/inventory) as JSON for React. Queries live in models/.
import * as Inventory from '../models/inventoryModel.js';
import { ownsCharacter, getSheetCharacter } from '../models/characterModel.js';

// GET /api/characters/:id/inventory
export async function getInventory(req, res) {
    
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    const ch = await getSheetCharacter(charId, req.session.userId);
    if (!ch) return res.status(404).json({ error: 'Character not found' });

    res.json({
        character: { id: ch.id, name: ch.name },
        armor: await Inventory.listArmorForCharacter(ch.class_id, ch.subclass_id, ch.level),
        weapons: await Inventory.listWeaponsForCharacter(ch.class_id, ch.subclass_id, ch.level),
        items: await Inventory.listItems(),
        ...(await Inventory.getOwnedIds(charId)),
    });
}

// Shared by the four add/remove routes: check ownership, run the change, answer with owned ids
async function changeOwned(req, res, change) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) {
        return res.status(404).json({ error: 'Character not found' });
    }
    await change(charId);
    res.json(await Inventory.getOwnedIds(charId));
}

// POST /api/characters/:id/inventory/armor   body: { armor_id }
export const addArmor = (req, res) => changeOwned(req, res, (id) => Inventory.addArmor(id, Number(req.body.armor_id)));

// POST /api/characters/:id/inventory/weapon   body: { weapon_id }
export const addWeapon = (req, res) => changeOwned(req, res, (id) => Inventory.addWeapon(id, Number(req.body.weapon_id)));

// POST /api/characters/:id/inventory/item   body: { item_id }
export const addItem = (req, res) => changeOwned(req, res, (id) => Inventory.addItem(id, Number(req.body.item_id)));

// POST /api/characters/:id/inventory/item/remove   body: { item_id }
export const removeItem = (req, res) => changeOwned(req, res, (id) => Inventory.removeItem(id, Number(req.body.item_id)));

// POST /api/characters/:id/inventory/armor/remove   body: { armor_id }
export const removeArmor = (req, res) => changeOwned(req, res, (id) => Inventory.removeArmor(id, Number(req.body.armor_id)));

// POST /api/characters/:id/inventory/weapon/remove   body: { weapon_id }
export const removeWeapon = (req, res) => changeOwned(req, res, (id) => Inventory.removeWeapon(id, Number(req.body.weapon_id)));
