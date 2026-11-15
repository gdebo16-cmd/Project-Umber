import { useState } from 'react';
import ItemShop from './ItemShop';
import { sendJson } from '../../utils/api';
import { useCharacter } from '../CharacterContext';
import WeaponFilter from '../../components/WeaponFilter';
import TabList from '../../components/TabList';
import RuneControl from './RuneControl';
import ItemDetails from './ItemDetails';
import { filterSortWeapons, EMPTY_WEAPON_FILTER } from '../../utils/weapons';

// The Inventory tab on the sheet, in 3 subtabs: Armor, Weapons and Items (equip slots for
// magical items, every rarity up to Object of Power).
// After each click the server sends back the new list, and the parent swaps it in,
// so Armor Class and Actions update right away.
const TABS = [
    { id: 'armor', label: 'Armor' },
    { id: 'weapons', label: 'Weapons' },
    { id: 'items', label: 'Items' },
];
export const ITEM_SLOTS = 3; // keep in sync with ITEM_SLOTS in models/inventoryModel.js

function InventoryTab() {
    const { character, ownedArmor, ownedWeapons, ownedItems = [], setOwnedArmor, setOwnedWeapons, setOwnedItems } = useCharacter();
    const characterId = character.id;
    const [error, setError] = useState('');
    const [tab, setTab] = useState('armor');
    const [browsing, setBrowsing] = useState(false); // true while the shop list is showing
    const [openItem, setOpenItem] = useState(null); // { kind: 'armor' | 'weapon' | 'item', id } whose details popup is open
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

    const itemAction = async (itemId, action) => {
        try {
            const data = await sendJson(`${base}/item/${action}`, 'POST', { item_id: itemId });
            setOwnedItems(data.ownedItems);
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
            setOwnedItems(data.ownedItems);
        } catch (err) {
            setError(err.message);
        }
        setBrowsing(false);
    };

    // Equipped / Unequip, or Equip, using the same markup for every kind
    const equipControls = (equipped, onEquip, onUnequip) => (equipped ? (
        <div className="action-button-container">
            <em className="equipped-item">Equipped</em>
            <form className="action-form" onSubmit={(e) => { e.preventDefault(); onUnequip(); }}>
                <button type="submit" className="action-button">Unequip</button>
            </form>
        </div>
    ) : (
        <form className="action-form" onSubmit={(e) => { e.preventDefault(); onEquip(); }}>
            <button type="submit" className="action-button">Equip</button>
        </form>
    ));

    const armorLabel = (a) => `${a.name} (${a.armor_type}, +${a.ac_bonus} AC)${(a.runes ?? []).length ? ` [${a.runes.map((r) => r.name).join(', ')}]` : ''}`;
    const weaponLabel = (w) => `${w.name} (${w.damage_dice} ${w.weapon_category ?? w.category})`;
    const itemLabel = (it) => `${it.name} (${it.rarity})${it.quantity > 1 ? ` x${it.quantity}` : ''}`;

    const magicItems = ownedItems.filter((it) => it.item_category === 'magical_item');
    const equippedCount = magicItems.filter((it) => it.is_equipped).length;

    // details popup (shared with the shop); armor keeps its rune controls inside it
    const openList = openItem && ({ armor: ownedArmor, weapon: ownedWeapons, item: ownedItems })[openItem.kind];
    const openData = openList && openList.find((x) => x.id === openItem.id);
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
            <TabList tabs={TABS} active={tab} onChange={setTab} prefix="bag-" />

            <article role="tabpanel" id="bag-panel-armor" className="action-container" aria-labelledby="bag-tab-armor" hidden={tab !== 'armor'}>
                <h3 className="action-title" id="armorTitle">Armor</h3>
                <ul id="armorList" className="action-set">
                    {ownedArmor.length === 0 ? (
                        <li className="action-item">No armor yet.</li>
                    ) : (
                        ownedArmor.map((a) => (
                            <li className="action-item" key={a.id}>
                                <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'armor', id: a.id })}>{armorLabel(a)}</button>
                                {equipControls(a.is_equipped, () => armorAction(a.id, 'equip'), () => armorAction(a.id, 'unequip'))}
                            </li>
                        ))
                    )}
                </ul>
            </article>

            <article role="tabpanel" id="bag-panel-weapons" className="action-container" aria-labelledby="bag-tab-weapons" hidden={tab !== 'weapons'}>
                <h3 className="action-title" id="weaponTitle">Weapons</h3>
                <WeaponFilter value={weaponFilter} onChange={setWeaponFilter} />
                <ul id="weaponsList" className="action-set">
                    {ownedWeapons.length === 0 ? (
                        <li className="action-item">No weapons yet.</li>
                    ) : (
                        filterSortWeapons(ownedWeapons, weaponFilter).map((w) => (
                            <li className="action-item" key={w.id}>
                                <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'weapon', id: w.id })}>{weaponLabel(w)}</button>
                                {equipControls(w.is_equipped, () => weaponAction(w.id, 'equip'), () => weaponAction(w.id, 'unequip'))}
                            </li>
                        ))
                    )}
                </ul>
            </article>

            <article role="tabpanel" id="bag-panel-items" className="action-container" aria-labelledby="bag-tab-items" hidden={tab !== 'items'}>
                <h3 className="action-title">Items: {equippedCount}/{ITEM_SLOTS} slots</h3>
                <ul className="action-set">
                    {ownedItems.length === 0 ? (
                        <li className="action-item">No items yet.</li>
                    ) : (
                        ownedItems.map((it) => (
                            <li className="action-item" key={it.id}>
                                <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'item', id: it.id })}>{itemLabel(it)}</button>
                                {it.item_category === 'magical_item' && equipControls(it.is_equipped, () => itemAction(it.id, 'equip'), () => itemAction(it.id, 'unequip'))}
                            </li>
                        ))
                    )}
                </ul>
            </article>

        </section>
        {details}
    </>
    );
}

export default InventoryTab;
