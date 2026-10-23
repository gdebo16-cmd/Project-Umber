export const ARMOR_CATEGORIES = [
    'light', 'medium', 'heavy', 'shield',
];

export const RARITIES = ['Common', 'Magical', 'Arcane', 'Mythical', 'Blessed'];

const rank = (list, v) => { const i = list.indexOf(v); return i < 0 ? list.length : i; };

// filter = { category: '' | name, rarity: '' | name, sort: 'name' | 'category' | 'rarity' }
export function filterSortArmor(armor, { category = '', rarity = '', sort = 'name' } = {}) {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const keyed = {
        name: byName,
        category: (a, b) => rank(ARMOR_CATEGORIES, a.armor_category) - rank(ARMOR_CATEGORIES, b.armor_category) || byName(a, b),
        rarity: (a, b) => rank(RARITIES, a.rarity) - rank(RARITIES, b.rarity) || byName(a, b),
    };
    return armor
        .filter((a) => (!category || a.armor_category === category) && (!rarity || a.rarity === rarity))
        .sort(keyed[sort] ?? byName);
}
export const EMPTY_ARMOR_FILTER = { category: '', rarity: '', sort: 'name' };
