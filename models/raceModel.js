// Species database reads, shaped like the old races/subraces API for the React client.
import pool from '../db.js';

export async function listRaces() {
    const { rows } = await pool.query(
        `SELECT s.id, s.name, s.description AS traits, s.image AS img_url,
                sz.name AS size, s.speed AS base_speed,
                NULL::text AS creature_type,
                NULL::text AS resistances,
                EXISTS (
                  SELECT 1 FROM species_features sf
                  JOIN features f ON f.id = sf.feature_id
                  WHERE sf.species_id = s.id AND lower(f.name) = 'darkvision'
                ) AS dark_vision,
                NULL::text AS signature_state,
                NULL::json AS race_spell,
                (
                  SELECT json_agg(json_build_object(
                    'name', f.name, 'description', COALESCE(f.description, '')
                  ) ORDER BY f.name)
                  FROM species_features sf
                  JOIN features f ON f.id = sf.feature_id
                  WHERE sf.species_id = s.id
                ) AS lineage_bonuses,
                (
                  SELECT json_agg(json_build_object(
                    'id', c.id, 'name', c.name, 'slug', c.key,
                    'description', c.description, 'img_url', c.image
                  ) ORDER BY c.sort_order NULLS LAST, c.id)
                  FROM species c WHERE c.parent_id = s.id
                ) AS subraces
         FROM species s
         JOIN sizes sz ON sz.id = s.size_id
         WHERE s.parent_id IS NULL
         ORDER BY s.sort_order NULLS LAST, s.name`
    );
    return rows;
}

// Child species (Lupine breeds, Vellari gems, Gehennan veins) for one parent species
export async function listSubraces(raceId) {
    const { rows } = await pool.query(
        `SELECT id, parent_id AS race_id, name, key AS slug, description, image AS img_url
         FROM species WHERE parent_id = $1
         ORDER BY sort_order NULLS LAST, id`,
        [raceId]
    );
    return rows;
}

// null/empty is fine; otherwise the child must belong to the parent. Returns the id to save or false
export function checkSubrace(raceId, subraceId) {
  if (subraceId === null || subraceId === undefined || subraceId === '') return null;
  const match = content.species.find(
      (s) => s.id === Number(subraceId) && s.parent_id === Number(raceId)
  );
  return match ? match.id : false;
}
