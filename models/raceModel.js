// Race database reads.
import pool from '../db.js';

export async function listRaces() {
    const { rows } = await pool.query(
        `SELECT r.id, r.name, r.traits, r.img_url, rt.creature_type, rt.size, rt.base_speed, rt.resistances, rt.dark_vision, (SELECT json_agg(json_build_object('name', b.name, 'description', b.description) ORDER BY b.id)
        FROM race_lineage_bonuses b WHERE b.race_id = r.id) AS lineage_bonuses,
        (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'description', s.description, 'img_url', s.img_url) ORDER BY s.id)
        FROM subraces s WHERE s.race_id = r.id) AS subraces
        FROM races r
        LEFT JOIN race_traits rt ON rt.race_id = r.id
        ORDER BY r.name`);
    return rows;
}

// Sub-races (Lupine breeds, Vellari gems) for one race
export async function listSubraces(raceId) {
    const { rows } = await pool.query(
        `SELECT id, race_id, name, slug, description, img_url FROM subraces WHERE race_id = $1 ORDER BY id`,
        [raceId]
    );
    return rows;
}

// null/empty is fine; otherwise the sub-race must belong to the race. Returns the id to save or false
export async function checkSubrace(raceId, subraceId) {
    if (subraceId === null || subraceId === undefined || subraceId === '') return null;
    const { rows } = await pool.query(
        `SELECT id FROM subraces WHERE id = $1 AND race_id = $2`,
        [Number(subraceId), Number(raceId)]
    );
    return rows.length ? rows[0].id : false;
}
