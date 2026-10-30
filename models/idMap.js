// Maps between legacy races/classes/sub_classes ids and species/roles/callings.
// All lookups from the content pack (DB catalogs stay until a later drop migration).
import content from './content.js';

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

function speciesAll() {
  return content.species ?? [];
}
function speciesById(id) {
  return speciesAll().find((s) => Number(s.id) === Number(id)) ?? null;
}
function parentSpecies(sp) {
  if (!sp) return null;
  if (sp.parent_id == null) return sp;
  return speciesById(sp.parent_id) ?? sp;
}
function rolesAll() {
  return content.roles ?? [];
}
function roleById(id) {
  return rolesAll().find((r) => Number(r.id) === Number(id)) ?? null;
}
function callingsOf(role) {
  return role?.callings ?? [];
}
function legacyRaces() {
  return content.legacy_races ?? [];
}
function legacySubraces() {
  return content.legacy_subraces ?? [];
}
function legacyClasses() {
  return content.legacy_classes ?? [];
}
function legacySubClasses() {
  return content.legacy_sub_classes ?? [];
}

// Parent species id <-> old races.id (species.sort_order = races.id)
export async function legacyRaceIdForSpecies(speciesId) {
  if (speciesId == null) return null;
  const sp = speciesById(speciesId);
  if (!sp) return null;
  const parent = parentSpecies(sp);
  return parent?.sort_order != null ? Number(parent.sort_order) : null;
}

export async function speciesIdForLegacyRace(raceId, subraceId = null) {
  if (raceId == null) return null;
  const parents = speciesAll().filter((s) => s.parent_id == null && Number(s.sort_order) === Number(raceId));
  const parent = parents[0];
  if (!parent) return null;
  if (subraceId != null && subraceId !== '') {
    const sr = legacySubraces().find((s) => Number(s.id) === Number(subraceId) && Number(s.race_id) === Number(raceId));
    if (sr) {
      const child = speciesAll().find(
        (s) => Number(s.parent_id) === Number(parent.id) && String(s.name).toLowerCase() === String(sr.name).toLowerCase()
      );
      if (child) return child.id;
    }
  }
  return parent.id;
}

export async function legacySubraceIdForSpecies(speciesId) {
  if (speciesId == null) return null;
  const child = speciesById(speciesId);
  if (!child?.parent_id) return null;
  const parent = speciesById(child.parent_id);
  if (!parent) return null;
  const raceId = parent.sort_order;
  const sr = legacySubraces().find(
    (s) => Number(s.race_id) === Number(raceId) && String(s.name).toLowerCase() === String(child.name).toLowerCase()
  );
  return sr?.id ?? null;
}

export async function legacyClassIdForRole(roleId) {
  if (roleId == null) return null;
  const role = roleById(roleId);
  if (!role) return null;
  const className = classNameForRole(role.name);
  const cl = legacyClasses().find((c) => String(c.name).toLowerCase() === String(className).toLowerCase());
  return cl?.id ?? null;
}

export async function roleIdForLegacyClass(classId) {
  if (classId == null) return null;
  const cl = legacyClasses().find((c) => Number(c.id) === Number(classId));
  if (!cl) return null;
  const roleName = roleNameForClass(cl.name);
  const role = rolesAll().find((r) => String(r.name).toLowerCase() === String(roleName).toLowerCase());
  return role?.id ?? null;
}

export async function legacySubclassIdForCalling(callingId) {
  if (callingId == null) return null;
  for (const role of rolesAll()) {
    const ca = callingsOf(role).find((c) => Number(c.id) === Number(callingId));
    if (!ca) continue;
    const className = classNameForRole(role.name);
    const cl = legacyClasses().find((c) => String(c.name).toLowerCase() === String(className).toLowerCase());
    if (!cl) return null;
    const sc = legacySubClasses().find(
      (s) => Number(s.class_id) === Number(cl.id) && String(s.name).toLowerCase() === String(ca.name).toLowerCase()
    );
    return sc?.id ?? null;
  }
  return null;
}

export async function callingIdForLegacySubclass(subclassId) {
  if (subclassId == null) return null;
  const sc = legacySubClasses().find((s) => Number(s.id) === Number(subclassId));
  if (!sc) return null;
  const cl = legacyClasses().find((c) => Number(c.id) === Number(sc.class_id));
  if (!cl) return null;
  const roleName = roleNameForClass(cl.name);
  const role = rolesAll().find((r) => String(r.name).toLowerCase() === String(roleName).toLowerCase());
  if (!role) return null;
  const ca = callingsOf(role).find((c) => String(c.name).toLowerCase() === String(sc.name).toLowerCase());
  return ca?.id ?? null;
}

// Resolve create/edit race payload (species ids in race_id / subrace_id fields) to both stores.
export async function resolveSpeciesWrite(raceId, subraceId) {
  const speciesInput = subraceId != null && subraceId !== '' ? Number(subraceId) : Number(raceId);
  const row = speciesById(speciesInput);
  if (!row) return null;
  // If client sent parent in race_id and child in subrace_id, prefer child when it belongs to parent
  if (subraceId != null && subraceId !== '' && Number(raceId) !== Number(subraceId)) {
    const child = speciesById(Number(subraceId));
    if (!child || Number(child.parent_id) !== Number(raceId)) return false;
    const parent = speciesById(child.parent_id);
    const legacySubraceId = await legacySubraceIdForSpecies(child.id);
    return {
      species_id: child.id,
      race_id: parent?.sort_order != null ? Number(parent.sort_order) : null,
      subrace_id: legacySubraceId,
    };
  }
  if (row.parent_id) {
    const parent = speciesById(row.parent_id);
    const legacySubraceId = await legacySubraceIdForSpecies(row.id);
    return {
      species_id: row.id,
      race_id: parent?.sort_order != null ? Number(parent.sort_order) : null,
      subrace_id: legacySubraceId,
    };
  }
  return {
    species_id: row.id,
    race_id: row.sort_order != null ? Number(row.sort_order) : null,
    subrace_id: null,
  };
}

export async function resolveRoleWrite(roleId, callingId) {
  const legacyClassId = await legacyClassIdForRole(roleId);
  if (!legacyClassId) return null;
  let legacySubclassId = null;
  if (callingId != null && callingId !== '') {
    const role = roleById(roleId);
    const ca = callingsOf(role).find((c) => Number(c.id) === Number(callingId));
    if (!ca) return false;
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