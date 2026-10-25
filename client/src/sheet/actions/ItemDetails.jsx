import { createPortal } from 'react-dom';

// Shared details popup for armor, weapons and items (shop and inventory).
// item = { kind: 'armor' | 'weapon' | 'item', data }; children render under the stats (e.g. rune controls).
const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
const props = (w) => w.properties ?? [];

function ItemDetails({ item, onClose, typeLabel, children }) {
    return createPortal(
        <article className="spell-details">
            <button type='button' className='btn-round spell-details-close' onClick={onClose}>X</button>
            <h3 className='spell-details-title'>{item.data.name}</h3>
            <section className="details-container">
                <section className="combat-box">
                    {item.kind === 'weapon' ? (
                        <>
                            <article className="combat-box-title"><h4>Weapon Details</h4></article>
                            <article className="combat-box-content">
                                <p>Range: <strong>{item.data.range_normal ? `${item.data.range_normal}/${item.data.range_long ?? item.data.range_normal} ft` : (props(item.data).includes('reach') ? '10 ft (reach)' : '5 ft')}</strong></p>
                                <p>Damage: <strong>{item.data.damage_dice}{item.data.damage_type ? ` ${item.data.damage_type}` : ''}</strong>{item.data.versatile_dice ? <> ({item.data.versatile_dice} two hands)</> : null}</p>
                                <p>Hands: <strong>{props(item.data).includes('two-handed') ? 'Two hands' : props(item.data).includes('versatile') ? 'One or two hands' : 'One hand'}</strong></p>
                                {item.data.weapon_category && <p>Category: <strong>{item.data.weapon_category}</strong></p>}
                                {item.data.attack_bonus ? <p>Magic: <strong>{signed(item.data.attack_bonus)}</strong></p> : null}
                                {item.data.rarity && <p>Rarity: <strong>{item.data.rarity}</strong></p>}
                            </article>
                        </>
                    ) : item.kind === 'item' ? (
                        <>
                            <article className="combat-box-title"><h4>Item Details</h4></article>
                            <article className="combat-box-content">
                                <p>Type: <strong>{typeLabel ? typeLabel(item.data) : (item.data.item_category ?? '-')}</strong></p>
                                <p>Rarity: <strong>{item.data.rarity}</strong></p>
                                {item.data.spell_name && <p>Spell: <strong>{item.data.spell_name}</strong></p>}
                                {item.data.uses != null && <p>Uses: <strong>{item.data.uses}{item.data.recharge ? ` (${item.data.recharge})` : ''}</strong></p>}
                                {item.data.consumable && <p>Consumable: <strong>Yes</strong></p>}
                                {item.data.weight_lb != null && <p>Weight: <strong>{Number(item.data.weight_lb)} lb</strong></p>}
                            </article>
                        </>
                    ) : (
                        <>
                            <article className="combat-box-title"><h4>Armor Details</h4></article>
                            <article className="combat-box-content">
                                <p>Type: <strong>{item.data.armor_type ?? '-'}</strong></p>
                                <p>AC: <strong>{item.data.ac_bonus ?? '-'}</strong></p>
                                {item.data.con_cap != null && <p>Cap: <strong>{item.data.con_cap}</strong></p>}
                                {item.data.stealth_disadvantage && <p>Shadowing: <strong>Disadvantage</strong></p>}
                                {item.data.rarity && <p>Rarity: <strong>{item.data.rarity}</strong></p>}
                            </article>
                        </>
                    )}
                </section>
            </section>
            {children}
            {item.data.description && (
                <section className="spell-description-box">
                    <p><strong>Description:</strong> <br /> {item.data.description}</p>
                </section>
            )}
        </article>
    , document.body);
}

export default ItemDetails;
