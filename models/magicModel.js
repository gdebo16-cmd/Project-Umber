// Magic access v3: alignment chart, personality picks (3 states), race element (4th affinity), spell strength bands.
// Spell catalog / states / elements / bands / alignments / personality / species affinities come from the JSON pack.
// Later cleanup: personality_options.needs_black_gate and callings.black_gate_level columns are unused (Black gate removed).
import pool from '../db.js';
import { resolveSpeciesWrite } from './idMap.js';
import {
    allSpells,
    getSpell,
    getState,
    getElement,
    getAlignment,
    getBandByName,
    getBandByOrd,
    liveStates,
} from './spellPack.js';
import content, { getAlignmentBand } from './content.js';

// Everything step 4 needs to draw its dropdowns, for one race/subrace
export async function listMagicOptions(raceId, subraceId) {
    const alignments = (content.alignments ?? [])
        .slice()
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((a) => ({ code: a.code, name: a.name, color: a.color, law_axis: a.law_axis, good_axis: a.good_axis }));
    const personality = (content.personality_options ?? [])
        .slice()
        .sort((a, b) => String(a.category).localeCompare(String(b.category)) || (a.sort ?? 0) - (b.sort ?? 0));
    const elements = await raceElements(raceId, subraceId);
    const raceSpells = await raceSpellOptions(raceId);
    const group = (cat) => personality.filter((p) => p.category === cat).map((p) => ({
        id: p.id, category: p.category, name: p.name, flavor: p.flavor, bio: p.bio,
        state: p.state, any_state: p.any_state, perk: p.perk,
    }));
    return {
        alignments,
        upbringing: group('upbringing'),
        lifestyle: group('lifestyle'),
        outlook: group('outlook'),
        states: liveStates(),
        elements,
        raceSpells,
    };
}

// Races that pick their starter spell at creation, by race element: { [element_id]: [{ id, name, description }] }.
// Human: any level-0 bless or manipulate spell of the element (Stone and Star have none, so their race starter).
// Wyrmkin: one evoke spell per element. Every other race has a fixed races.race_spell_id, so {}.
export async function raceSpellOptions(raceId) {
    const speciesWrite = await resolveSpeciesWrite(raceId, null);
    const speciesRow = (content.species ?? []).find((s) => Number(s.id) === Number(speciesWrite?.species_id ?? raceId))
        ?? (content.species ?? []).find((s) => s.parent_id == null && Number(s.sort_order) === Number(speciesWrite?.race_id ?? raceId));
    const race = speciesRow ? { name: speciesRow.parent_id
        ? ((content.species ?? []).find((p) => Number(p.id) === Number(speciesRow.parent_id))?.name ?? speciesRow.name)
        : speciesRow.name } : null;
    if (!race) return {};

    const wyrmkin = new Map([
        ['Flame', 'Ember Spark'],
        ['Frost', 'Frost Punch'],
        ['Storm', 'Spark Grip'],
        ['Venom', 'Spit Venom'],
        ['Stone', 'Grit Spit'],
    ]);
    const humanExtra = new Map([
        ['Stone', 'Pebble Shield'],
        ['Star', 'Starmend'],
    ]);

    const out = {};
    for (const s of allSpells()) {
        if (Number(s.base_level) !== 0) continue;
        const st = getState(s.state_id);
        const el = getElement(s.element_id);
        if (!el) continue;
        const stName = String(st?.name ?? '').toLowerCase();
        let ok = false;
        if (race.name === 'Human') {
            ok = stName === 'bless' || stName === 'manipulate' || humanExtra.get(el.name) === s.name;
        } else if (race.name === 'Wyrmkin') {
            ok = wyrmkin.get(el.name) === s.name;
        }
        if (!ok) continue;
        (out[s.element_id] ??= []).push({
            id: s.id,
            name: s.name,
            description: s.base_description,
        });
    }
    for (const key of Object.keys(out)) {
        out[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
}

// Alignment chart squares (editor picker)
export async function listAlignments() {
    return (content.alignments ?? [])
        .slice()
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((a) => ({ code: a.code, name: a.name, color: a.color }));
}

// Alignment change check: code must exist. Returns an error string or null
export async function checkAlignmentChange(charId, code) {
    const ok = (content.alignments ?? []).some((a) => a.code === code);
    if (!ok) return 'Pick an alignment';
    return null;
}

// The race's listed elements from pack species_affinity_elements (child list when present)
export async function raceElements(raceId, subraceId) {
    const species = await resolveSpeciesWrite(raceId, subraceId ?? null);
    const sid = Number(species?.species_id ?? subraceId ?? raceId);
    const links = content.species_affinity_elements ?? [];
    let rows = links.filter((r) => Number(r.species_id) === sid);
    if (!rows.length && species?.species_id != null && subraceId) {
        const parentId = Number(species.species_id);
        // resolveSpeciesWrite with subrace sets species_id to child; if empty, try parent
        const child = (content.species ?? []).find((s) => Number(s.id) === sid);
        if (child?.parent_id != null) {
            rows = links.filter((r) => Number(r.species_id) === Number(child.parent_id));
        } else {
            rows = links.filter((r) => Number(r.species_id) === parentId);
        }
    }
    if (!rows.length) {
        // Try parent species when create passed legacy race id only
        const parent = (content.species ?? []).find((s) => s.parent_id == null && Number(s.id) === sid)
            ?? (content.species ?? []).find((s) => s.parent_id == null && Number(s.sort_order) === Number(species?.race_id ?? raceId));
        if (parent) rows = links.filter((r) => Number(r.species_id) === Number(parent.id));
    }
    return rows
        .map((r) => ({ id: r.element_id, name: getElement(r.element_id)?.name }))
        .filter((e) => e.name)
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Check a step 4 body against the draft. Returns { magic } to save, or { error }
export async function checkMagicPicks(draft, body) {
    const code = String(body.alignment_code ?? '');
    const alOk = (content.alignments ?? []).some((a) => a.code === code);
    if (!alOk) return { error: 'Pick an alignment' };

    const ids = ['upbringing', 'lifestyle', 'outlook'].map((c) => Number(body[`${c}_id`]));
    const opts = (content.personality_options ?? []).filter((p) => ids.includes(Number(p.id)));
    const live = liveStates();
    const magic = { alignment_code: code };
    for (const [i, cat] of ['upbringing', 'lifestyle', 'outlook'].entries()) {
        const opt = opts.find((o) => o.id === ids[i] && o.category === cat);
        if (!opt) return { error: `Pick an ${cat === 'upbringing' ? 'Upbringing' : cat === 'lifestyle' ? 'Lifestyle' : 'Outlook'}` };
        // wildcard (Self-Taught Stray): the player picks any live state (including destroy)
        const state = opt.any_state ? String(body[`${cat}_state`] ?? '').toLowerCase() : opt.state.toLowerCase();
        if (opt.any_state && !live.includes(state)) return { error: `Pick a state for ${opt.name}` };
        magic[`${cat}_id`] = opt.id;
        magic[`${cat}_state`] = state;
    }
    if (new Set([magic.upbringing_state, magic.lifestyle_state, magic.outlook_state]).size !== 3) {
        return { error: 'Upbringing, Lifestyle and Outlook must give 3 different states' };
    }
    const elements = await raceElements(draft.race_id, draft.subrace_id);
    const el = elements.find((e) => e.id === Number(body.race_element_id));
    if (!el) return { error: 'Pick a race element' };
    magic.race_element_id = el.id;
    const choices = (await raceSpellOptions(draft.race_id))[el.id] ?? [];
    if (choices.length) {
        const spell = choices.find((s) => s.id === Number(body.race_spell_id));
        if (!spell) return { error: 'Pick a race spell' };
        magic.race_spell_id = spell.id;
    }
    return { magic };
}

// Spell strength from pack + character row (no JOIN to spells tables).
export async function spellStrength(characterId, spellId) {
    const spell = getSpell(spellId);
    if (!spell) return null;
    const al = getAlignment(spell.alignment_id);
    const st = getState(spell.state_id);
    const { rows } = await pool.query(
        `SELECT alignment_code, race_element_id, upbringing_state, lifestyle_state, outlook_state
         FROM characters WHERE id = $1`,
        [characterId]
    );
    if (!rows.length || !rows[0].alignment_code || !al?.chart_square) return null;
    const c = rows[0];
    const chart_band = getAlignmentBand(c.alignment_code, al.chart_square);
    const bandRow = getBandByName(chart_band);
    if (!bandRow) return null;
    const stName = String(st?.name ?? '').toLowerCase();
    const boosted = Number(spell.element_id) === Number(c.race_element_id)
        || [c.upbringing_state, c.lifestyle_state, c.outlook_state].map((x) => String(x ?? '').toLowerCase()).includes(stName);
    const ord = Math.min(4, Number(bandRow.ord) + (boosted ? 1 : 0));
    const band = getBandByOrd(ord);
    if (!band) return null;
    return { band: band.name, chart_band, boosted: !!boosted, modifiers: band.modifiers };
}