// Maps between legacy races/classes/sub_classes ids and species/roles/callings.
// New create/edit APIs speak in species/role/calling ids; legacy feature, spell,
// proficiency and affinity tables still key off the old ids, so writes dual-store both.
import pool from '../db.js';

const ROLE_TO_CLASS_NAME = {
  Templar: 'Paladin',
  Seer: 'Druid',
};
const CLASS_TO_ROLE_NAME = {
  Paladin: 'Templar',
  Druid: 'Seer',
};

function roleNameForClass(className) {
  return CLASS_TO_ROLE_NAME[className] || className;
}

function classNameForRole(roleName) {
  return ROLE_TO_CLASS_NAME[roleName] || roleName;
}

// Parent species id <-> old races.id (species.sort_order = races.id)
export async function legacyRaceIdForSpecies(speciesId) {
  if (speciesId == null) return null;
  const { rows } = await pool.query(
    `SELECT COALESCE(p.sort_order, s.sort_order)::int AS race_id
     FROM species s
     LEFT JOIN species p ON p.id = s.parent_id
     WHERE s.id = $1`,
    [Number(speciesId)]
  );
  return rows[0]?.race_id ?? null;
}

export async function speciesIdForLegacyRace(raceId, subraceId = null) {
  if (raceId == null) return null;
  if (subraceId != null && subraceId !== '') {
    const { rows } = await pool.query(
      `SELECT child.id
       FROM subraces sr
       JOIN races r ON r.id = sr.race_id
       JOIN species parent ON parent.parent_id IS NULL AND parent.sort_order = r.id
       JOIN species child ON child.parent_id = parent.id AND lower(child.name) = lower(sr.name)
       WHERE sr.id = $1 AND r.id = $2`,
      [Number(subraceId), Number(raceId)]
    );
    if (rows[0]) return rows[0].id;
  }
  const { rows } = await pool.query(
    `SELECT id FROM species WHERE parent_id IS NULL AND sort_order = $1`,
    [Number(raceId)]
  );
  return rows[0]?.id ?? null;
}

export async function legacySubraceIdForSpecies(speciesId) {
  if (speciesId == null) return null;
  const { rows } = await pool.query(
    `SELECT sr.id
     FROM species child
     JOIN species parent ON parent.id = child.parent_id
     JOIN races r ON r.id = parent.sort_order
     JOIN subraces sr ON sr.race_id = r.id AND lower(sr.name) = lower(child.name)
     WHERE child.id = $1 AND child.parent_id IS NOT NULL`,
    [Number(speciesId)]
  );
  return rows[0]?.id ?? null;
}

export async function legacyClassIdForRole(roleId) {
  if (roleId == null) return null;
  const { rows } = await pool.query(
    `SELECT cl.id
     FROM roles ro
     JOIN classes cl ON lower(cl.name) = lower(
       CASE ro.name WHEN 'Templar' THEN 'Paladin' WHEN 'Seer' THEN 'Druid' ELSE ro.name END
     )
     WHERE ro.id = $1`,
    [Number(roleId)]
  );
  return rows[0]?.id ?? null;
}

export async function roleIdForLegacyClass(classId) {
  if (classId == null) return null;
  const { rows } = await pool.query(
    `SELECT ro.id
     FROM classes cl
     JOIN roles ro ON lower(ro.name) = lower(
       CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
     )
     WHERE cl.id = $1`,
    [Number(classId)]
  );
  return rows[0]?.id ?? null;
}

export async function legacySubclassIdForCalling(callingId) {
  if (callingId == null) return null;
  const { rows } = await pool.query(
    `SELECT sc.id
     FROM callings ca
     JOIN roles ro ON ro.id = ca.role_id
     JOIN classes cl ON lower(cl.name) = lower(
       CASE ro.name WHEN 'Templar' THEN 'Paladin' WHEN 'Seer' THEN 'Druid' ELSE ro.name END
     )
     JOIN sub_classes sc ON sc.class_id = cl.id AND lower(sc.name) = lower(ca.name)
     WHERE ca.id = $1`,
    [Number(callingId)]
  );
  return rows[0]?.id ?? null;
}

export async function callingIdForLegacySubclass(subclassId) {
  if (subclassId == null) return null;
  const { rows } = await pool.query(
    `SELECT ca.id
     FROM sub_classes sc
     JOIN classes cl ON cl.id = sc.class_id
     JOIN roles ro ON lower(ro.name) = lower(
       CASE cl.name WHEN 'Paladin' THEN 'Templar' WHEN 'Druid' THEN 'Seer' ELSE cl.name END
     )
     JOIN callings ca ON ca.role_id = ro.id AND lower(ca.name) = lower(sc.name)
     WHERE sc.id = $1`,
    [Number(subclassId)]
  );
  return rows[0]?.id ?? null;
}

// Resolve create/edit race payload (species ids in race_id / subrace_id fields) to both stores.
export async function resolveSpeciesWrite(raceId, subraceId) {
  const speciesInput = subraceId != null && subraceId !== '' ? Number(subraceId) : Number(raceId);
  const { rows } = await pool.query(
    `SELECT s.id, s.parent_id, COALESCE(p.sort_order, s.sort_order)::int AS legacy_race_id
     FROM species s
     LEFT JOIN species p ON p.id = s.parent_id
     WHERE s.id = $1`,
    [speciesInput]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  // If client sent parent in race_id and child in subrace_id, prefer child when it belongs to parent
  if (subraceId != null && subraceId !== '' && Number(raceId) !== Number(subraceId)) {
    const { rows: child } = await pool.query(
      `SELECT s.id, s.parent_id, p.sort_order::int AS legacy_race_id
       FROM species s
       JOIN species p ON p.id = s.parent_id
       WHERE s.id = $1 AND s.parent_id = $2`,
      [Number(subraceId), Number(raceId)]
    );
    if (!child[0]) return false;
    const legacySubraceId = await legacySubraceIdForSpecies(child[0].id);
    return {
      species_id: child[0].id,
      race_id: child[0].legacy_race_id,
      subrace_id: legacySubraceId,
    };
  }
  // Single id: parent or leaf
  if (row.parent_id) {
    const legacySubraceId = await legacySubraceIdForSpecies(row.id);
    return { species_id: row.id, race_id: row.legacy_race_id, subrace_id: legacySubraceId };
  }
  return { species_id: row.id, race_id: row.legacy_race_id, subrace_id: null };
}

export async function resolveRoleWrite(roleId, callingId) {
  const legacyClassId = await legacyClassIdForRole(roleId);
  if (!legacyClassId) return null;
  let legacySubclassId = null;
  if (callingId != null && callingId !== '') {
    const { rows } = await pool.query(
      `SELECT id FROM callings WHERE id = $1 AND role_id = $2`,
      [Number(callingId), Number(roleId)]
    );
    if (!rows[0]) return false;
    legacySubclassId = await legacySubclassIdForCalling(Number(callingId));
  }
  return {
    role_id: Number(roleId),
    calling_id: callingId != null && callingId !== '' ? Number(callingId) : null,
    class_id: legacyClassId,
    subclass_id: legacySubclassId,
  };
}

export { roleNameForClass, classNameForRole };
