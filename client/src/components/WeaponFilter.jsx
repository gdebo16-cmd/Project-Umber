import { WEAPON_CATEGORIES, RARITIES } from '../utils/weapons';

// Category / rarity filters and a sort picker for any weapon list. value = { category, rarity, sort }.
function WeaponFilter({ value, onChange, showRarity = true }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
    return (
        <div className="filter-container name-value-top-half">
            <select className="field cat-filter" aria-label="Weapon category" value={value.category} onChange={set('category')}>
                <option value="">All categories</option>
                {WEAPON_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {showRarity && (
                <select className="field rare-filter" aria-label="Rarity" value={value.rarity} onChange={set('rarity')}>
                    <option value="">All rarities</option>
                    {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
            )}
            <select className="field name-filter" aria-label="Sort weapons" value={value.sort} onChange={set('sort')}>
                <option value="name">Sort: Name</option>
                <option value="category">Sort: Category</option>
                {showRarity && <option value="rarity">Sort: Rarity</option>}
            </select>
        </div>
    );
}

export default WeaponFilter;
