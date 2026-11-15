import * as Monsters from '../models/monsterModel.js';
import { getMonster, listMonsters } from '../models/monsterPack.js';

// GET /api/monsters  -> short catalog for the "Add monster" picker
export function getCatalog(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    res.json(listMonsters());
}

// GET /api/campaigns/:id/monsters
export async function listCampaignMonsters(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    if (!(await Monsters.isDm(req.params.id, req.session.userId))) return res.status(403).json({ error: 'DM only.' });
    const rows = await Monsters.listForCampaign(req.params.id);
    res.json(rows.map((r) => ({ ...r, name: getMonster(r.monster_id)?.name ?? 'Unknown monster' })));
}

// POST /api/campaigns/:id/monsters   body: { monster_id, nickname }
export async function addMonster(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    if (!(await Monsters.isDm(req.params.id, req.session.userId))) return res.status(403).json({ error: 'DM only.' });
    const m = getMonster(req.body?.monster_id);
    if (!m) return res.status(400).json({ error: 'Unknown monster.' });
    const nickname = String(req.body.nickname ?? '').trim() || m.name;
    res.json(await Monsters.add(req.params.id, m.id, nickname, m.max_hp));
}

// Shared check for the one-monster routes: does it exist, and is this user its campaign's DM?
async function loadOwned(req, res) {
    if (!req.session.userId) { res.status(401).json({ error: 'not logged in.' }); return null; }
    const row = await Monsters.getOne(req.params.id);
    if (!row || !(await Monsters.isDm(row.campaign_id, req.session.userId))) {
        res.status(404).json({ error: 'Monster not found.' }); return null;
    }
    return row;
}

// GET /api/campaign_monsters/:id  -> the sheet: saved row + full stat block from the pack
export async function getMonsterSheet(req, res) {
    const row = await loadOwned(req, res); if (!row) return;
    res.json({ ...getMonster(row.monster_id), ...row, monster_id: row.monster_id });
}

// PUT /api/campaign_monsters/:id   body: { current_hp, conditions, notes }
export async function updateMonster(req, res) {
    const row = await loadOwned(req, res); if (!row) return;
    const { current_hp = row.current_hp, conditions = row.conditions, notes = row.notes } = req.body ?? {};
    await Monsters.update(row.id, current_hp, conditions, notes);
    res.json({ ok: true });
}

// DELETE /api/campaign_monsters/:id
export async function deleteMonster(req, res) {
    const row = await loadOwned(req, res); if (!row) return;
    await Monsters.remove(row.id);
    res.json({ ok: true });
}