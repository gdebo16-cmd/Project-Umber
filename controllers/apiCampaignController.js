import * as Campaigns from '../models/campaignModel.js';

// ---------- campaign sheet ----------

// GET /api/campaigns/:id
export async function getCampaign(req, res) {
    if (!req.session.userId) return res.status(401).json({ error: 'not logged in.' });
    const campaign = await Campaigns.getCampaign(req.params.id, req.session.userId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign });
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