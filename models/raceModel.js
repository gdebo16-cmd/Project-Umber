// Species reads from the content pack, shaped like the old races/subraces API for the React client.
import content from './content.js';

function parents() {
    return (content.species ?? []).filter((s) => s.parent_id == null);
}

function childrenOf(parentId) {
    const pid = Number(parentId);
    return (content.species ?? [])
        .filter((s) => s.parent_id != null && Number(s.parent_id) === pid)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
}

export async function listRaces() {
    return parents()
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name).localeCompare(String(b.name)))
        .map((s) => {
            const traits = s.traits ?? [];
            return {
                id: s.id,
                name: s.name,
                traits: s.description,
                img_url: s.image,
                size: s.size,
                base_speed: s.speed,
                creature_type: s.creature_type ?? null,
                resistances: s.resistances ?? null,
                dark_vision: !!s.darkvision,
                signature_state: s.signature_state ?? null,
                race_spell: s.race_spell ?? null,
                lineage_bonuses: traits.map((t) => ({
                    name: t.name,
                    description: t.description ?? '',
                })),
                subraces: childrenOf(s.id).map((c) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.key,
                    description: c.description,
                    img_url: c.image,
                })),
            };
        });
}

export async function listSubraces(raceId) {
    return childrenOf(raceId).map((c) => ({
        id: c.id,
        race_id: c.parent_id,
        name: c.name,
        slug: c.key,
        description: c.description,
        img_url: c.image,
    }));
}

// null/empty is fine; otherwise the child must belong to the parent. Returns the id to save or false
export function checkSubrace(raceId, subraceId) {
    if (subraceId === null || subraceId === undefined || subraceId === '') return null;
    const match = (content.species ?? []).find(
        (s) => s.id === Number(subraceId) && s.parent_id === Number(raceId)
    );
    return match ? match.id : false;
}
