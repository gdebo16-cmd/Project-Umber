import { useState } from 'react';
import ItemShop from './ItemShop';
import { sendJson } from '../../utils/api';
import { useCharacter } from '../CharacterContext';
import WeaponFilter from '../../components/WeaponFilter';
import RuneControl from './RuneControl';
import ItemDetails from './ItemDetails';
import { filterSortWeapons, EMPTY_WEAPON_FILTER } from '../../utils/weapons';

// The Inventory tab on the sheet: what you own, with Equip / Unequip buttons.
// After each click the server sends back the new list, and the parent swaps it in,
// so Armor Class and Actions update right away.
function InventoryTab() {
    const { character, ownedArmor, ownedWeapons, setOwnedArmor, setOwnedWeapons } = useCharacter();
    const characterId = character.id;
    const [error, setError] = useState('');
    const [browsing, setBrowsing] = useState(false); // true while the shop list is showing
    const [openItem, setOpenItem] = useState(null); // { kind: 'armor' | 'weapon', id } whose details popup is open
    const [weaponFilter, setWeaponFilter] = useState(EMPTY_WEAPON_FILTER);
    const base = `/api/characters/${characterId}/inventory`;

    const armorAction = async (armorId, action) => {
        try {
            const data = await sendJson(`${base}/armor/${action}`, 'POST', { armor_id: armorId });
            setOwnedArmor(data.ownedArmor);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const weaponAction = async (weaponId, action) => {
        try {
            const data = await sendJson(`${base}/weapon/${action}`, 'POST', { weapon_id: weaponId });
            setOwnedWeapons(data.ownedWeapons);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    // When you click Done, reload the owned lists so new items show up here,
    // and so Armor Class and Actions stay in sync.
    const finishBrowsing = async () => {
        try {
            const res = await fetch(`/api/characters/${characterId}`);
            const data = await res.json();
            setOwnedArmor(data.ownedArmor);
            setOwnedWeapons(data.ownedWeapons);
        } catch (err) {
            setError(err.message);
        }
        setBrowsing(false);
    };



    // details popup (shared with the shop); armor keeps its rune controls inside it
    const openData = openItem && (openItem.kind === 'armor' ? ownedArmor : ownedWeapons).find((x) => x.id === openItem.id);
    const details = openData && (
        <ItemDetails item={{ kind: openItem.kind, data: openData }} onClose={() => setOpenItem(null)}>
            {openItem.kind === 'armor' && (
                <RuneControl kind="armor" itemId={openData.id} itemType={openData.armor_type === 'shield' ? 'shield' : 'armor'} itemRunes={openData.runes ?? []} />
            )}
        </ItemDetails>
    );

    if (browsing) {
        return <ItemShop characterId={characterId} onDone={finishBrowsing} />;
    }
    return (
        <>
        <section className='title-tile'>
                <h3 className="spell-tab-title" id="inventory-title">Inventory</h3>
                <button type="button" className="shop-entry" onClick={() => setBrowsing(true)}>Visit the Shop</button>
            {error && <p>{error}</p>}
        </section>

        <section className='panel-shell'>
            <ul className="action-container">
                <li className="action-list">
                    <span className="action-title" id="armorTitle">Armor</span>
                    <ul id="armorList" className="action-set">
                        {ownedArmor.length === 0 ? (
                            <li className="action-item">No armor yet.</li>
                        ) : (
                            ownedArmor.map((a) => (
                                <li className="action-item" key={a.id}>
                                    <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'armor', id: a.id })}>
                                        {a.name} ({a.armor_type}, +{a.ac_bonus} AC){(a.runes ?? []).length ? ` [${a.runes.map((r) => r.name).join(', ')}]` : ''}
                                    </button>
                                    {a.is_equipped ? (
                                        <div className="action-button-container">
                                            <em className="equipped-item">Equipped</em>
                                            <form className="action-form" onSubmit={(e) => { e.preventDefault(); armorAction(a.id, 'unequip'); }}>
                                                <button type="submit" className="action-button">Unequip</button>
                                            </form>
                                        </div>
                                    ) : (
                                        <form className="action-form" onSubmit={(e) => { e.preventDefault(); armorAction(a.id, 'equip'); }}>
                                            <button type="submit" className="action-button">Equip</button>
                                        </form>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </li>

                <li className="action-list">
                    <span className="action-title" id="weaponTitle">Weapons</span>
                    <WeaponFilter value={weaponFilter} onChange={setWeaponFilter} />
                    <ul id="weaponsList" className="action-set">
                        {ownedWeapons.length === 0 ? (
                            <li className="action-item">No weapons yet.</li>
                        ) : (
                            filterSortWeapons(ownedWeapons, weaponFilter).map((w) => (
                                <li className="action-item" key={w.id}>
                                    <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'weapon', id: w.id })}>
                                        {w.name} ({w.damage_dice} {w.weapon_category ?? w.category})
                                    </button>
                                    {w.is_equipped ? (
                                        <div className="action-button-container">
                                            <em className="equipped-item">Equipped</em>
                                            <form className="action-form" onSubmit={(e) => { e.preventDefault(); weaponAction(w.id, 'unequip'); }}>
                                                <button type="submit" className="action-button">Unequip</button>
                                            </form>
                                        </div>
                                    ) : (
                                        <form className="action-form" onSubmit={(e) => { e.preventDefault(); weaponAction(w.id, 'equip'); }}>
                                            <button type="submit" className="action-button">Equip</button>
                                        </form>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </li>
            </ul>
        </section>
        {details}
    </>
    );
}

export default InventoryTab;
