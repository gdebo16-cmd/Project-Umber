// Race database reads.
import pool from '../db.js';

export async function listRaces() {
    const { rows } = await pool.query(
        `SELECT r.id, r.name, r.traits, r.img_url, rt.creature_type, rt.size, rt.base_speed, rt.resistances, rt.dark_vision, (SELECT json_agg(json_build_object('name', b.name, 'description', b.description) ORDER BY b.id)
        FROM race_lineage_bonuses b WHERE b.race_id = r.id) AS lineage_bonuses
        FROM races r
        LEFT JOIN race_traits rt ON rt.race_id = r.id
        ORDER BY r.name`);
    return rows;
}
