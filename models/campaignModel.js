import pool from '../db.js';

//---------- campaign creation ----------

export async function createCampaign(userId, name, description) {
    const { rows } = await pool.query(
        `INSERT INTO campaigns (user_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
        [userId, name, description]
    );
    return rows[0].id;
}

export async function deleteCampaign(campId, userId) {
    const { rowCount } = await pool.query(
        `DELETE FROM campaigns WHERE id = $1 AND user_id = $2`,
        [campId, userId]
    );
    return rowCount;
}

export async function getCampaign(campId, userId) {
    const { rows } = await pool.query(
        `SELECT id, name, description, campaign_img_url FROM campaigns WHERE id = $1 AND user_id = $2`,
        [campId, userId]
    );
    return rows[0];
}

export async function updateCampaign(campId, userId, name, description) {
    await pool.query(
        `UPDATE campaigns SET name = $1, description = $2 WHERE id = $3 AND user_id = $4`,
        [name, description, campId, userId]
    );
}

export async function listCampaigns(userId) {
    const { rows } = await pool.query(
        `SELECT id, name, description, campaign_img_url FROM campaigns WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}