import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import TabList from '../../components/TabList';
import { sendJson } from '../../utils/api';
import Loader from '../../components/Loader';
import WeaponFilter from '../../components/WeaponFilter';
import { filterSortWeapons, EMPTY_WEAPON_FILTER } from '../../utils/weapons';

const TABS = [
    { id: 'armor', label: 'Armor' },
    { id: 'weapons', label: 'Weapons' },
];

// The "shop": every armor and weapon, with Add / Remove buttons.
// Used two ways: inside the sheet's Inventory tab, and on the /inventory page.
// onDone runs when you click "Done browsing".
function ItemShop({ characterId, onDone }) {
    const { data, setData, loading, error } = useFetch(`/api/characters/${characterId}/inventory`);
    const [tab, setTab] = useState('armor');
    const [saveError, setSaveError] = useState('');
    const [weaponFilter, setWeaponFilter] = useState(EMPTY_WEAPON_FILTER);

    // kind is 'armor' or 'weapon', action is 'add' or 'remove'
    const changeItem = async (kind, itemId, action) => {
        const url = `/api/characters/${characterId}/inventory/${kind}${action === 'remove' ? '/remove' : ''}`;
        try {
            const owned = await sendJson(url, 'POST', { [`${kind}_id`]: itemId });
            setData((prev) => ({ ...prev, ...owned })); // swap in the new owned id lists
            setSaveError('');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    // one Add/Remove button, shared by both lists
    const itemButton = (kind, itemId, owned) => (
        owned ? (
            <>
                <em className="ownedItem">Owned</em>
                <form className="removeItemForm" onSubmit={(e) => { e.preventDefault(); changeItem(kind, itemId, 'remove'); }}>
                    <button type="submit" id="remove-item-button" className="btn btn-action hover-grow">Remove</button>
                </form>
            </>
        ) : (
            <form className="addItemForm" onSubmit={(e) => { e.preventDefault(); changeItem(kind, itemId, 'add'); }}>
                <button type="submit" id="add-item-button" className="btn btn-action hover-grow">Add</button>
            </form>
        )
    );

    if (loading) return <Loader />;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { armor, weapons, ownedArmorIds, ownedWeaponIds } = data;

    return (
        <>
            <section className="title-tile">
                <h3 className="action-title tile-top">Item Shop</h3>
                <button type="button" className="btn btn-link hover-grow" onClick={onDone}>Done browsing</button>
                {saveError && <p>{saveError}</p>}
            </section>
            
            <section className="panel-shell item-shop">
            <TabList tabs={TABS} active={tab} onChange={setTab} prefix="inv-" />

            <article role="tabpanel" id="inv-panel-armor" className="action-tile inv-panel" aria-labelledby="inv-tab-armor" hidden={tab !== 'armor'}>
                <h3 className="action-title tile-top">Armor</h3>
                <ul className="action-list inv-list">
                    {armor.map((a) => (
                        <li key={a.id} className="action-item inv-list-item">
                            {a.name} ({a.armor_type}, {a.ac_bonus} AC)
                            {itemButton('armor', a.id, ownedArmorIds.includes(Number(a.id)))}
                        </li>
                    ))}
                </ul>
            </article>

            <article role="tabpanel" id="inv-panel-weapons" className="action-tile inv-panel" aria-labelledby="inv-tab-weapons" hidden={tab !== 'weapons'}>
                <h3 className="action-title tile-top">Weapons</h3>
                <WeaponFilter value={weaponFilter} onChange={setWeaponFilter} />
                <ul className="action-list inv-list">
                    {filterSortWeapons(weapons, weaponFilter).map((w) => (
                        <li key={w.id} className="action-item inv-list-item">
                            {w.name} ({w.weapon_category}, {w.damage_dice}, {w.rarity}, {w.attack_bonus} Attack Bonus)
                            {itemButton('weapon', w.id, ownedWeaponIds.includes(Number(w.id)))}
                        </li>
                    ))}
                </ul>
            </article>
            </section>
        </>
    );
}

export default ItemShop;