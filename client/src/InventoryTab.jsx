import { useState } from 'react';
import ItemShop from './ItemShop';
import { sendJson } from './api';

// The Inventory tab on the sheet: what you own, with Equip / Unequip buttons.
// After each click the server sends back the new list, and the parent swaps it in,
// so Armor Class and Actions update right away.
function InventoryTab({ characterId, ownedArmor, ownedWeapons, onArmorChange, onWeaponsChange }) {
    const [error, setError] = useState('');
    const [browsing, setBrowsing] = useState(false); // true while the shop list is showing
    const base = `/api/characters/${characterId}/inventory`;

    const armorAction = async (armorId, action) => {
        try {
            const data = await sendJson(`${base}/armor/${action}`, 'POST', { armor_id: armorId });
            onArmorChange(data.ownedArmor);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const weaponAction = async (weaponId, action) => {
        try {
            const data = await sendJson(`${base}/weapon/${action}`, 'POST', { weapon_id: weaponId });
            onWeaponsChange(data.ownedWeapons);
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
            onArmorChange(data.ownedArmor);
            onWeaponsChange(data.ownedWeapons);
        } catch (err) {
            setError(err.message);
        }
        setBrowsing(false);
    };

    if (browsing) {
        return <ItemShop characterId={characterId} onDone={finishBrowsing} />;
    }
    return (
        <>
            <h2 className="tabTitle" id="inventoryTitle">Inventory</h2>
            <p id="inventoryLink"><button type="button" className="hover-grow" onClick={() => setBrowsing(true)}>Add Armor &amp; weapons</button></p>
            {error && <p>{error}</p>}

            <h3 className="invTitle cap-top" id="armorTitle">Armor</h3>
            {ownedArmor.length === 0 ? (
                <p>No armor yet.</p>
            ) : (
                <ul id="armorList" className="invList cap-bottom">
                    {ownedArmor.map((a) => (
                        <li key={a.id}>
                            {a.name} ({a.armor_type}, +{a.ac_bonus} AC)
                            {a.is_equipped ? (
                                <>
                                    <em className="equippedItem">Equipped</em>
                                    <form className="removeItemForm" onSubmit={(e) => { e.preventDefault(); armorAction(a.id, 'unequip'); }}>
                                        <button type="submit" className="unequipItemButton hover-grow">Unequip</button>
                                    </form>
                                </>
                            ) : (
                                <form className="equipItemForm" onSubmit={(e) => { e.preventDefault(); armorAction(a.id, 'equip'); }}>
                                        <button type="submit" className="equipItemButton hover-grow">Equip</button>
                                    </form>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <h3 className="invTitle cap-top" id="weaponsTitle">Weapons</h3>
            {ownedWeapons.length === 0 ? (
                <p>No weapons yet.</p>
            ) : (
                <ul id="weaponsList" className="invList cap-bottom">
                    {ownedWeapons.map((w) => (
                        <li key={w.id}>
                            {w.name} ({w.damage_dice} {w.category})
                            {w.is_equipped ? (
                                <>
                                    <em className="equippedItem">Equipped</em>
                                    <form className="removeItemForm" onSubmit={(e) => { e.preventDefault(); weaponAction(w.id, 'unequip'); }}>
                                        <button type="submit" className="unequipItemButton hover-grow">Unequip</button>
                                    </form>
                                </>
                            ) : (
                                <form className="equipItemForm" onSubmit={(e) => { e.preventDefault(); weaponAction(w.id, 'equip'); }}>
                                        <button type="submit" className="equipItemButton hover-grow">Equip</button>
                                    </form>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

export default InventoryTab;
