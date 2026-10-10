import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import TabList from '../../components/TabList';
import { sendJson } from '../../utils/api';

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
                    <button type="submit" className="removeItemButton hover-grow">Remove</button>
                </form>
            </>
        ) : (
            <form className="addItemForm" onSubmit={(e) => { e.preventDefault(); changeItem(kind, itemId, 'add'); }}>
                <button type="submit" className="addItemButton hover-grow">Add</button>
            </form>
        )
    );

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { armor, weapons, ownedArmorIds, ownedWeaponIds } = data;

    return (
        <>
            {/* the button and error sit outside the shell, so the shell's grid only holds the tabs and the list */}
            <button type="button" className="hover-grow" onClick={onDone}>Done browsing</button>
            {saveError && <p>{saveError}</p>}
            <section className="panel-shell item-shop">
            <TabList tabs={TABS} active={tab} onChange={setTab} prefix="inv-" />

            <article role="tabpanel" id="inv-panel-armor" className="inv-panel" aria-labelledby="inv-tab-armor" hidden={tab !== 'armor'}>
                <h2 className="tabTitle">Armor</h2>
                <ul className="invList">
                    {armor.map((a) => (
                        <li key={a.id} className="invListItem">
                            {a.name} ({a.armor_type}, {a.ac_bonus} AC)
                            {itemButton('armor', a.id, ownedArmorIds.includes(Number(a.id)))}
                        </li>
                    ))}
                </ul>
            </article>

            <article role="tabpanel" id="inv-panel-weapons" className="inv-panel" aria-labelledby="inv-tab-weapons" hidden={tab !== 'weapons'}>
                <h2 className="tabTitle">Weapons</h2>
                <ul className="invList">
                    {weapons.map((w) => (
                        <li key={w.id} className="invListItem">
                            {w.name} ({w.category}, {w.damage_dice}, {w.rarity}, {w.attack_bonus} Attack Bonus)
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