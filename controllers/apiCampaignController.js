import * as Campaigns from '../models/campaignModel.js';

// ---------- campaign sheet ----------

// GET /api/campaigns/:id
export async function getCampaign(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const campaign = await Campaigns.getCampaign(req.params.id, req.session.userId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const members = await Campaigns.listMembers(req.params.id);
    res.json({ campaign, members });
 }

// PATCH /api/campaigns/:id   body: { name, description }
export async function updateCampaign(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const { name, description } = req.body;
    await Campaigns.updateCampaign(req.params.id, req.session.userId, name, description);
    res.json({ ok: true });
}

// DELETE /api/campaigns/:id
export async function deleteCampaign(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    await Campaigns.deleteCampaign(req.params.id, req.session.userId);
    res.json({ ok: true });
}

// ---------- campaign creation ----------

// POST /api/campaigns   body: { name, description }
export async function createCampaign(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const name = String(req.body.name ?? '').trim() || 'A tale in the making';
    const { description } = req.body;
    const id =await Campaigns.createCampaign(req.session.userId, name, description);
    res.status(201).json({ id });
}

// GET /api/campaigns
export async function listCampaigns(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const campaigns = await Campaigns.listCampaigns(req.session.userId);
    res.json({ campaigns })
}

// ---------- campaign joining ----------

// POST /api/campaigns/join   body: { code }
export async function joinCampaign(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Invite code required' });
    const campId = await Campaigns.joinCampaign(code, req.session.userId);
    if (!campId) return res.status(404).json({ error: 'no campaign found with that code' });
    res.json({ id: campId });
}

// ---------- campaign character ----------

// POST /api/campaigns/:id/characters   body: { characterId }
export async function setCampaignCharacter(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const { characterId } = req.body;
    if (!characterId) return res.status(400).json({ error: 'Character ID required' });
    const MId = await Campaigns.setMemberCharacter(req.params.id, req.session.userId, characterId);
    if (!MId) return res.status(404).json({ error: 'Character or Campaign not found' });
    res.json({ ok: true });
}