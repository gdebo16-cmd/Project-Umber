// Rune effects the sheet applies automatically (rune-weaver-inscribe-runes.md): Keen (+1 to hit, not on top of an item's own +N),
// damage riders (Ember/Rime/Spark/Gall), Guard (+1 AC, once) and Warding (resistance). Several copies of one effect don't stack.
const RIDER_TYPES = { 'Ember Rune': 'fire', 'Rime Rune': 'cold', 'Spark Rune': 'lightning', 'Gall Rune': 'acid' };

export function weaponRuneEffects(w) {
    const runes = w.runes ?? [];
    const keen = runes.some((r) => r.name === 'Keen Rune') && !(Number(w.attack_bonus) > 0);
    const riders = runes.filter((r) => r.is_damage_rider).map((r) => ({ name: r.name, dice: r.dice, type: RIDER_TYPES[r.name] ?? '' }));
    return { hitBonus: keen ? 1 : 0, riders };
}

export function armorRuneEffects(ownedArmor) {
    const runes = ownedArmor.filter((a) => a.is_equipped).flatMap((a) => a.runes ?? []);
    return {
        acBonus: runes.some((r) => r.name === 'Guard Rune') ? 1 : 0,
        resist: [...new Set(runes.filter((r) => r.name === 'Warding Rune' && r.choice_value).map((r) => r.choice_value))],
    };
}

// Runic Strike: +1d6 force (2d6 at 10, 3d6 at 18, 4d6 at 24)
export const runicStrikeDice = (level) => (level >= 24 ? '4d6' : level >= 18 ? '3d6' : level >= 10 ? '2d6' : '1d6');
