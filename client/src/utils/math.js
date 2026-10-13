export const modOf = (score) => Math.floor(Number(score) / 2) - 5;
export const signed = (n) => (n >= 0 ? '+' : '') + n;

export const healthInit = (current, max) => {
    const pct = max > 0 ? current / max : 0;
    if (pct >= 1) return 4;
    if (pct >= 0.75) return 3;
    if (pct >= 0.5) return 2;
    if (pct >= 0.25) return 1;
    return 0;
};

// "2d6" -> roll two 6-sided dice and add them up
export const rollDice = (dice) => {
    const text = String(dice).replace(/\s/g, '');          // "3d4 + 3" becomes "3d4+3"
    if (!text.includes('d')) return Number(text) || 0;     // a flat number like "20"
    const [diePart, bonus = 0] = text.split('+');          // "3d4" and "3"
    const [count, sides] = diePart.split('d').map(Number);
    let total = Number(bonus);
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
    return total;
};

export const d20 = () => Math.floor(Math.random() * 20) + 1;

// roll 4d6 and drop the lowest (used by the character editor's roll buttons)
export const roll4d6DropLowest = () => {
    const dice = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
    dice.sort((a, b) => a - b);
    return dice[1] + dice[2] + dice[3];
};

// "strength" -> "Strength"
export const capitalize = (text) => (text || '').replace(/^\w/, (c) => c.toUpperCase());


export const proficiencyBonus = (level) => 2 + Math.floor((level - 1) / 4);
