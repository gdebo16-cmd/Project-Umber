// Rune Weaver limits (rune-weaver-inscribe-runes.md section 3). Index 0 = level 1 ... index 29 = level 30.
export const RUNE_WEAVER = 'Rune Weaver';
// Pack equivalent of Rune Weaver is Tome of Inscription (item_runes tooling still applies to both names).
export const RUNE_WEAVER_NAMES = ['Rune Weaver', 'Tome of Inscription'];
export const RUNES_PER_ITEM = [0,0,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3];
export const ACTIVE_RUNES = [0,0,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6,6,6,7,7,7,7,8,8,8];
export const WARDING_TYPES = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'];

const at = (arr, level) => arr[Math.min(30, Math.max(1, Number(level) || 1)) - 1];
export const runesPerItem = (level) => at(RUNES_PER_ITEM, level);
export const activeRunes = (level) => at(ACTIVE_RUNES, level);

// No gear table: runes listed for "gear" go on worn armor or shields instead (Lantern, Hush, Mending, Dusksight, Fleet, Warding).
export const runeFitsItem = (itemTypes, type) => itemTypes.includes(type) || (itemTypes.includes('gear') && (type === 'armor' || type === 'shield'));
/*prep-done*/
