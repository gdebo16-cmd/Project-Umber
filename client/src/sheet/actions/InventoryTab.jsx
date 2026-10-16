import { useState } from 'react';
import ItemShop from './ItemShop';
import { sendJson } from '../../utils/api';
import { useCharacter } from '../CharacterContext';

// The Inventory tab on the sheet: what you own, with Equip / Unequip buttons.
// After each click the server sends back the new list, and the parent swaps it in,
// so Armor Class and Actions update right away.
function InventoryTab() {
    const { character, ownedArmor, ownedWeapons, setOwnedArmor, setOwnedWeapons } = useCharacter();
    const characterId = character.id;
    const [error, setError] = useState('');
    const [browsing, setBrowsing] = useState(false); // true while the shop list is showing
    const [openWeaponId, setOpenWeaponId] = useState(null); // weapon whose rarity and description are showing
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

    if (browsing) {
        return <ItemShop characterId={characterId} onDone={finishBrowsing} />;
    }
    return (
        <section id="inventory-container">
            <article className='title-tile'>
                <h3 className="action-title" id="inventory-title">Inventory</h3>
                <button type="button" className="btn btn-link hover-grow" onClick={() => setBrowsing(true)}>Add Armor &amp; weapons</button>
            </article>
            {error && <p>{error}</p>}

            {/* Same shape as the spell levels: one wrapper li per group, with a title on top and the list under it */}
            <ul className="action-list spell-list">
                <li className="action-item spell-slot">
                    <span className="action-title" id="armorTitle">Armor</span>
                    <ul id="armorList" className="action-list">
                        {ownedArmor.length === 0 ? (
                            <li className="action-item spell">No armor yet.</li>
                        ) : (
                            ownedArmor.map((a) => (
                                <li className="action-item spell" key={a.id}>
                                    {a.name} ({a.armor_type}, +{a.ac_bonus} AC)
                                    {a.is_equipped ? (
                                        <div className="action-button-container">
                                            <em className="equipped-item">Equipped</em>
                                            <form className="removeItemForm" onSubmit={(e) => { e.preventDefault(); armorAction(a.id, 'unequip'); }}>
                                                <button type="submit" className="btn btn-action hover-grow">Unequip</button>
                                            </form>
                                        </div>
                                    ) : (
                                        <form className="equipItemForm" onSubmit={(e) => { e.preventDefault(); armorAction(a.id, 'equip'); }}>
                                            <button type="submit" className="btn btn-action hover-grow">Equip</button>
                                        </form>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </li>

                <li className="action-item spell-slot">
                    <span className="action-title" id="weaponsTitle">Weapons</span>
                    <ul id="weaponsList" className="action-list">
                        {ownedWeapons.length === 0 ? (
                            <li className="action-item spell">No weapons yet.</li>
                        ) : (
                            ownedWeapons.map((w) => (
                                <li className="action-item spell" key={w.id}>
                                    <button type="button" className="btn btn-spell-name hover-grow" onClick={() => setOpenWeaponId(openWeaponId === w.id ? null : w.id)}>
                                        {w.name} ({w.damage_dice} {w.weapon_category ?? w.category})
                                    </button>
                                    {openWeaponId === w.id && (
                                        <p>{w.rarity && <strong>{w.rarity}. </strong>}{w.description}</p>
                                    )}
                                    {w.is_equipped ? (
                                        <div className="action-button-container">
                                            <em className="equipped-item">Equipped</em>
                                            <form className="removeItemForm" onSubmit={(e) => { e.preventDefault(); weaponAction(w.id, 'unequip'); }}>
                                                <button type="submit" className="btn btn-action hover-grow">Unequip</button>
                                            </form>
                                        </div>
                                    ) : (
                                        <form className="equipItemForm" onSubmit={(e) => { e.preventDefault(); weaponAction(w.id, 'equip'); }}>
                                            <button type="submit" className="btn btn-action hover-grow">Equip</button>
                                        </form>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </li>
            </ul>
        </section>
    );
}

export default InventoryTab;
