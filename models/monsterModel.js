import pool from '../db.js';

// Is this user the DM of this campaign? (role lives in campaign_members)
export async function isDm(campId, userId) {
    const { rows } = await pool.query(
        `SELECT 1 FROM campaign_members WHERE campaign_id = $1 AND user_id = $2 AND role = 'dm'`,
        [campId, userId]);
    return rows.length > 0;
}

export async function listForCampaign(campId) {
    const { rows } = await pool.query(
        `SELECT * FROM campaign_monsters WHERE campaign_id = $1 ORDER BY created_at`, [campId]);
    return rows;
}

export async function getOne(id) {
    const { rows } = await pool.query(`SELECT * FROM campaign_monsters WHERE id = $1`, [id]);
    return rows[0];
}

export async function add(campId, monsterId, nickname, hp) {
    const { rows } = await pool.query(
        `INSERT INTO campaign_monsters (campaign_id, monster_id, nickname, current_hp)
         VALUES ($1, $2, $3, $4) RETURNING *`, [campId, monsterId, nickname, hp]);
    return rows[0];
}

export async function update(id, currentHp, conditions, notes) {
    await pool.query(
        `UPDATE campaign_monsters SET current_hp = $1, conditions = $2, notes = $3 WHERE id = $4`,
        [currentHp, conditions, notes, id]);
}

export async function remove(id) {
    await pool.query(`DELETE FROM campaign_monsters WHERE id = $1`, [id]);
}