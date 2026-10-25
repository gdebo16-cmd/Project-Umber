// Magic access v3: alignment chart, personality picks (3 states), race element (4th affinity), spell strength bands.
// Lookup tables: alignments, alignment_bands, spell_bands, personality_options, race_affinity_elements, sub_classes.black_gate_level
import pool from '../db.js';

export const BLACK_GATE_TARGET = 'CE'; // Black gate: alignment Aligned/Attuned to CE on the chart (CE, NE, CN)

// Everything step 4 needs to draw its dropdowns, for one race/subrace
export async function listMagicOptions(raceId, subraceId) {
    const [alignments, personality, elements, gate] = await Promise.all([
        pool.query(`SELECT code, name, color, law_axis, good_axis FROM alignments ORDER BY sort`),
        pool.query(`SELECT id, category, name, flavor, bio, state, any_state, perk, needs_black_gate FROM personality_options ORDER BY category, sort`),
        raceElements(raceId, subraceId),
        pool.query(`SELECT alignment_code FROM alignment_bands WHERE color_square = $1 AND band IN ('Aligned', 'Attuned') ORDER BY alignment_code`, [BLACK_GATE_TARGET]),
    ]);
    const states = await pool.query(`SELECT lower(name) AS name FROM spell_state WHERE NOT retired ORDER BY id`);
    const group = (cat) => personality.rows.filter((p) => p.category === cat);
    return {
        alignments: alignments.rows,
        upbringing: group('upbringing'),
        lifestyle: group('lifestyle'),
        outlook: group('outlook'),
        states: states.rows.map((s) => s.name),
        elements,
        blackGateAlignments: gate.rows.map((r) => r.alignment_code),
    };
}

// Alignment chart squares (editor picker)
export async function listAlignments() {
    const { rows } = await pool.query(`SELECT code, name, color FROM alignments ORDER BY sort`);
    return rows;
}

// Alignment change check: picks that need the Black gate must keep it. Returns an error string or null
export async function checkAlignmentChange(charId, code) {
    const { rows: al } = await pool.query(`SELECT code FROM alignments WHERE code = $1`, [code]);
    if (!al.length) return 'Pick an alignment';
    const { rows } = await pool.query(
        `SELECT c.subclass_id, c.level, bool_or(p.needs_black_gate) AS gated
         FROM characters c LEFT JOIN personality_options p ON p.id IN (c.upbringing_id, c.lifestyle_id, c.outlook_id)
         WHERE c.id = $1 GROUP BY c.id`, [charId]);
    if (rows[0]?.gated && !(await hasBlackGate(code, rows[0].subclass_id, rows[0].level))) {
        return 'Your background uses a Black gate pick, so the alignment must stay CE, NE or CN';
    }
    return null;
}

// The race's listed elements (a subrace's own list when it has one)
export async function raceElements(raceId, subraceId) {
    const { rows } = await pool.query(
        `SELECT e.id, e.name FROM race_affinity_elements rae JOIN spell_element e ON e.id = rae.element_id
         WHERE rae.race_id = $1
           AND (rae.subrace_id = $2 OR (rae.subrace_id IS NULL AND NOT EXISTS
                (SELECT 1 FROM race_affinity_elements x WHERE x.race_id = $1 AND x.subrace_id = $2)))
         ORDER BY e.name`,
        [raceId, subraceId ?? null]
    );
    return rows;
}

// Black gate: alignment Aligned/Attuned to CE AND a Black-gated subclass at its gate level
export async function hasBlackGate(alignmentCode, subclassId, level) {
    if (!alignmentCode || !subclassId) return false;
    const { rows } = await pool.query(
        `SELECT 1 FROM sub_classes sc, alignment_bands ab
         WHERE sc.id = $1 AND sc.black_gate_level IS NOT NULL AND sc.black_gate_level <= $2
           AND ab.alignment_code = $3 AND ab.color_square = $4 AND ab.band IN ('Aligned', 'Attuned')`,
        [subclassId, level ?? 1, alignmentCode, BLACK_GATE_TARGET]
    );
    return rows.length > 0;
}

// Check a step 4 body against the draft. Returns { magic } to save, or { error }
export async function checkMagicPicks(draft, body) {
    const code = String(body.alignment_code ?? '');
    const { rows: al } = await pool.query(`SELECT code FROM alignments WHERE code = $1`, [code]);
    if (!al.length) return { error: 'Pick an alignment' };

    const ids = ['upbringing', 'lifestyle', 'outlook'].map((c) => Number(body[`${c}_id`]));
    const { rows: opts } = await pool.query(`SELECT * FROM personality_options WHERE id = ANY($1::int[])`, [ids]);
    const gate = await hasBlackGate(code, draft.subclass_id, draft.level ?? 1);
    const { rows: st } = await pool.query(`SELECT lower(name) AS name FROM spell_state WHERE NOT retired`);
    const live = st.map((s) => s.name);
    const magic = { alignment_code: code };
    for (const [i, cat] of ['upbringing', 'lifestyle', 'outlook'].entries()) {
        const opt = opts.find((o) => o.id === ids[i] && o.category === cat);
        if (!opt) return { error: `Pick an ${cat === 'upbringing' ? 'Upbringing' : cat === 'lifestyle' ? 'Lifestyle' : 'Outlook'}` };
        if (opt.needs_black_gate && !gate) return { error: `${opt.name} needs the Black gate (CE, NE or CN alignment and a Black-gated subclass)` };
        // wildcard (Self-Taught Stray): the player picks any state except destroy
        const state = opt.any_state ? String(body[`${cat}_state`] ?? '').toLowerCase() : opt.state.toLowerCase();
        if (opt.any_state && (state === 'destroy' || !live.includes(state))) return { error: `Pick a state for ${opt.name}` };
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
    return { magic };
}

// Spell strength: chart band (alignment vs the square of the spell's colour), then one band stronger
// (max Attuned) if the spell's element is the race element or its state is one of the 3 personality states.
// Never weakens. Returns { band, chart_band, boosted, modifiers } or null when the character has no alignment yet.
export async function spellStrength(characterId, spellId) {
    const { rows } = await pool.query(
        `SELECT ab.band AS chart_band, b.ord,
                (s.element_id = c.race_element_id
                 OR lower(st.name) IN (c.upbringing_state, c.lifestyle_state, c.outlook_state)) AS boosted
         FROM characters c
         JOIN spells s ON s.id = $2
         JOIN spell_state st ON st.id = s.state_id
         JOIN spell_alignment sa ON sa.color = s.color
         JOIN alignment_bands ab ON ab.alignment_code = c.alignment_code AND ab.color_square = sa.chart_square
         JOIN spell_bands b ON b.name = ab.band
         WHERE c.id = $1`,
        [characterId, spellId]
    );
    if (!rows.length) return null;
    const r = rows[0];
    const ord = Math.min(4, r.ord + (r.boosted ? 1 : 0));
    const { rows: band } = await pool.query(`SELECT name, modifiers FROM spell_bands WHERE ord = $1`, [ord]);
    return { band: band[0].name, chart_band: r.chart_band, boosted: !!r.boosted, modifiers: band[0].modifiers };
}
