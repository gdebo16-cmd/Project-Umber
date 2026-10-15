import pool from '../db.js';

//---------- campaign creation ----------

export async function createCampaign(userId, name, description) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `INSERT INTO campaigns (user_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
            [userId, name, description]
        );

        const campId = rows[0].id;
        await client.query(
            `INSERT INTO campaign_members (campaign_id, user_id, role) VALUES ($1, $2, 'dm')`,
            [campId, userId]
        );
        await client.query('COMMIT');
        return campId;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
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
        `SELECT c.id, c.name, c.description, c.campaign_img_url, c.invite_code, m.role, m.character_id FROM campaign_members m JOIN campaigns c ON c.id = m.campaign_id WHERE c.id = $1 AND m.user_id = $2`,
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
        `SELECT c.id, c.name, c.description, c.campaign_img_url, c.invite_code, m.role FROM campaign_members m JOIN campaigns c ON c.id = m.campaign_id WHERE m.user_id = $1
        ORDER BY c.created_at DESC`,
        [userId]
    );
    return rows;
}

export async function joinCampaign(code, userId) {
    const cleanCode = code.trim().toUpperCase();
    const { rows } = await pool.query(
        `SELECT id FROM campaigns WHERE invite_code= $1`, 
        [cleanCode]
    );
    if (rows.length === 0) return null;
    const campId = rows[0].id;

    await pool.query(
        `INSERT INTO campaign_members (campaign_id, user_id, role) VALUES ($1, $2, 'player')
        ON CONFLICT (campaign_id, user_id) DO NOTHING`,
        [campId, userId]
    );
    return campId;
}

export async function setMemberCharacter(campId, userId, characterId) {
    const { rowCount } = await pool.query(
        `UPDATE campaign_members SET character_id = $3 WHERE campaign_id = $1 AND user_id = $2
        AND EXISTS (SELECT 1 FROM characters WHERE id = $3 AND user_id = $2)`,
        [campId, userId, characterId]
    );
    return rowCount;
}

export async function listMembers(campId) {
    const { rows } = await pool.query(
        `SELECT u.username, m.role, ch.id AS character_id, ch.name AS character_name, ch.portrait_url
        FROM campaign_members m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN characters ch ON ch.id = m.character_id
        WHERE m.campaign_id = $1
        ORDER BY m.role, m.joined_at`,
        [campId]
    );
    return rows;
}