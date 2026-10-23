// Rune Weaver rune routes (Inscribe Runes). Rules are enforced in models/runeModel.js.
import * as Characters from '../models/characterModel.js';
import * as Inventory from '../models/inventoryModel.js';
import * as Runes from '../models/runeModel.js';

const { ownsCharacter } = Characters;

async function guard(req, res) {
    if (!req.session.userId) { res.status(401).json({ error: 'Not logged in' }); return null; }
    const charId = Number(req.params.id);
    if (!(await ownsCharacter(charId, req.session.userId))) { res.status(404).json({ error: 'Character not found' }); return null; }
    return charId;
}

// after a change, send everything the sheet needs to redraw
const fresh = async (charId) => ({
    runeInfo: await Runes.getRuneInfo(charId),
    ownedWeapons: await Inventory.getOwnedWeapons(charId),
    ownedArmor: await Inventory.getOwnedArmor(charId),
});

// GET /api/characters/:id/runes
export async function getRunes(req, res) {
    const charId = await guard(req, res); if (charId == null) return;
    res.json(await Runes.getRuneInfo(charId));
}

// POST /api/characters/:id/runes/inscribe   body: { kind: 'weapon'|'armor', item_id, rune_id, choice_value }
export async function inscribe(req, res) {
    const charId = await guard(req, res); if (charId == null) return;
    const b = req.body || {};
    const r = await Runes.inscribeRune(charId, { kind: b.kind, itemId: Number(b.item_id), runeId: Number(b.rune_id), choiceValue: b.choice_value });
    if (r.error) return res.status(r.status).json({ error: r.error });
    res.json({ ...(await fresh(charId)), endedOldest: r.endedOldest });
}

// POST /api/characters/:id/runes/remove   body: { item_rune_id }
export async function remove(req, res) {
    const charId = await guard(req, res); if (charId == null) return;
    const r = await Runes.removeRune(charId, Number(req.body?.item_rune_id));
    if (r.error) return res.status(r.status).json({ error: r.error });
    res.json(await fresh(charId));
}

// POST /api/characters/:id/runes/runed-weapon   body: { weapon_id | null }
export async function runedWeapon(req, res) {
    const charId = await guard(req, res); if (charId == null) return;
    const id = req.body?.weapon_id == null ? null : Number(req.body.weapon_id);
    const r = await Runes.setRunedWeapon(charId, id);
    if (r.error) return res.status(r.status).json({ error: r.error });
    res.json(await fresh(charId));
}
