const SLOT_TABLE = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 2, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 3, 1],
    13: [4, 3, 3, 3, 3, 2, 1],
    14: [4, 3, 3, 3, 3, 3, 1],
    15: [4, 3, 3, 3, 3, 3, 2, 1],
    16: [4, 3, 3, 3, 3, 3, 3, 1],
    17: [4, 3, 3, 3, 3, 3, 3, 2, 1],
    18: [4, 3, 3, 3, 3, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    20: [4, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    21: [4, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    22: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    23: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    24: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    25: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    26: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    27: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    28: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    29: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    30: [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
}

import { d20, rollDice } from './math.js';

// classSlots = character.spell_slots from class_spell_slots. Classes with no rows (null) use the full-caster table above.
export function getSpellSlots(level, classSlots) {
    if (Array.isArray(classSlots)) return classSlots;
    const capped = Math.min(Math.max(level, 1), 30);
    return SLOT_TABLE[capped] || [];
}

// Beams a spell fires at a character level, from spells.beam_scaling ([{ level, beams }, ...]). No data = 1 beam.
export function beamsAt(spell, level) {
    const steps = Array.isArray(spell?.beam_scaling) ? spell.beam_scaling : [];
    return steps.reduce((n, st) => (Number(level) >= st.level ? st.beams : n), 1);
}

// One to-hit + damage roll per beam, as one line for the roll orb
export function beamRollText(beams, toHit, dice, dmgMod = 0) {
    return Array.from({ length: beams }, (_, i) =>
        `Beam ${i + 1}: to hit ${d20() + toHit}${dice ? `, damage ${Math.max(0, rollDice(dice) + dmgMod)}` : ''}`).join(' | ');
}
