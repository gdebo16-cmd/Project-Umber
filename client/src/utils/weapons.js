// Weapon list helpers: the 8 categories and the rarity tiers, in display order.
export const WEAPON_CATEGORIES = [
    'Minor', 'Elegant One-Handed', 'Broad One-Handed', 'Ranged One-Handed',
    'Versatile', 'Reach', 'Great', 'Ranged Two-Handed',
];
export const RARITIES = ['Common', 'Magical', 'Arcane', 'Mythical', 'Calamity'];

const rank = (list, v) => { const i = list.indexOf(v); return i < 0 ? list.length : i; };

// filter = { category: '' | name, rarity: '' | name, sort: 'name' | 'category' | 'rarity' }
export function filterSortWeapons(weapons, { category = '', rarity = '', sort = 'name' } = {}) {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const keyed = {
        name: byName,
        category: (a, b) => rank(WEAPON_CATEGORIES, a.weapon_category) - rank(WEAPON_CATEGORIES, b.weapon_category) || byName(a, b),
        rarity: (a, b) => rank(RARITIES, a.rarity) - rank(RARITIES, b.rarity) || byName(a, b),
    };
    return weapons
        .filter((w) => (!category || w.weapon_category === category) && (!rarity || w.rarity === rarity))
        .sort(keyed[sort] ?? byName);
}
export const EMPTY_WEAPON_FILTER = { category: '', rarity: '', sort: 'name' };
