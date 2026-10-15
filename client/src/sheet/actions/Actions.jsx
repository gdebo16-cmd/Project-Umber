import { useState } from 'react';
import { modOf, signed, healthInit, rollDice, d20, proficiencyBonus } from '../../utils/math';
import { useCharacter } from '../CharacterContext';
import { getSpellSlots } from '../../utils/spellSlots';
import { createPortal } from 'react-dom';

// Your equipped weapons plus Fists. Each has a To Hit button and a Damage button.
function Actions() {
    const { character, hp, ownedWeapons, onRoll, learnedSpells, spendSlot, usedSlots = {}, actionFeatures = [] } = useCharacter();
    const actionSpells = learnedSpells ?? [];
    const spellScore = character[(character.spell_stat || '').toLowerCase()];
    const init = modOf(character.dex) + healthInit(hp, character.max_hp);
    const strMod = modOf(character.str);
    const spellMod = modOf(spellScore);
    const spellToHit =  spellMod + proficiencyBonus(character.level);
    const spellSave = 8 + spellToHit;
    const toHit = init + strMod;
    // melee attacks use the class's primary stat (spell_stat is the class primary_stat)
    const primaryMod = modOf(spellScore);
    const meleeHit = init + primaryMod;
    const actionSpellsList = actionSpells.filter((s) => s.is_action);
   

    // Fists get weaker as you get hurt. Always at least 1d4.
    const fistDice = `${Math.max(1, Math.floor((character.str + hp) / 20))}d4`;

    // Every action has the same shape, so one map() can draw them all
    const actions = [
        ...ownedWeapons.filter((w) => w.is_equipped).map((w) => {
            const ranged = w.category === 'ranged';
            const dmgMod = ranged ? modOf(character.dex) : primaryMod;
            return { key: `w${w.id}`, name: w.name, dice: w.damage_dice, dmgMod, hit: ranged ? toHit : meleeHit };
        }),
        { key: 'fists', name: 'Fists', dice: fistDice, dmgMod: 0, hit: meleeHit },
    ];

    const [openItem, setOpenItem] = useState(null);
    const rollHit = (a) => onRoll(`Chance to hit: ${d20() + (a?.hit ?? toHit)}`);
    const rollDamage = (a) => onRoll(`Damage dealt: ${Math.max(0, rollDice(a.dice) + a.dmgMod)}`);

    // Spends one slot at the spell's level, then shows the message. Stops if none are left.
    const castSpell = (s, message) => {
        if (spendSlot && !spendSlot(s.base_level)) return onRoll(`No level ${s.base_level} slots left!`);
        onRoll(message);
    };

    // --- Upcasting ---
    const [pickerFor, setPickerFor] = useState(null);   // id of the spell whose level picker is open
    const [castLevels, setCastLevels] = useState({});   // last level each spell was cast at, by spell id

    // Slot levels from the spell's level up that still have a slot left
    const openSlotLevels = (s) => {
        const slots = getSpellSlots(character.level);
        const levels = [];
        for (let lvl = s.base_level; lvl <= slots.length; lvl++) {
            if ((usedSlots[lvl] || 0) < slots[lvl - 1]) levels.push(lvl);
        }
        return levels;
    };

    // Dice at a cast level: the spell_upcasts row for that level if there is one, else the base dice
    const diceAt = (s, lvl) => {
        const up = (s.upcasts || []).find((u) => u.cast_level === lvl);
        return up?.damage_dice || up?.heal_dice || s.base_damage_dice;
    };

    // Spells that can be upcast open the picker; cantrips and spells with no upcast rows (like Misty Step) cast right away
    const onCastClick = (s, castNow) => {
        if (s.base_level < 1 || !(s.upcasts && s.upcasts.length)) return castNow();
        if (openSlotLevels(s).length === 0) return onRoll(`No level ${s.base_level} slots left!`);
        setPickerFor(pickerFor === s.id ? null : s.id);
    };

    // Called when a level is picked: spend that slot, remember the level, show the result
    const castAtLevel = (s, lvl) => {
        setPickerFor(null);
        if (spendSlot && !spendSlot(lvl)) return onRoll(`No level ${lvl} slots left!`);
        setCastLevels({ ...castLevels, [s.id]: lvl });
        const start = `${character.name} casts ${s.name} at level ${lvl}!`;
        const dice = diceAt(s, lvl);
        if (s.attack_type) return onRoll(`${start} Chance to hit: ${d20() + spellToHit + (s.base_to_hit_modifier || 0)}`);
        if (s.opponent_save_roll) return onRoll(`${start} Target must make a ${s.opponent_save_roll} roll and roll higher than a ${spellSave}`);
        if (dice) return onRoll(`${start} Damage dealt: ${Math.max(0, rollDice(dice) + (s.dmgMod || 0))}`);
        onRoll(start);
    };

    const ACTION_LABELS = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };
    const bonusFeatures = actionFeatures.filter((f) => f.action_type === 'bonus');
    const reactionFeatures = actionFeatures.filter((f) => f.action_type === 'reaction');


    return (
        // Same shape as the Spells and Inventory tabs: one list of groups,
        // each group = a title on top + its list of rows underneath
        <ul className="action-list spell-list">
            <li className="action-item spell-slot">
                <span className="action-title" id="physical-actions-title">Physical Actions</span>
                <ul className="action-list" id="physical-actions-list">
                    {actions.map((a) => (
                        <li key={a.key} className="action-item spell">
                            <button type="button" className="btn btn-spell-name hover-grow" onClick={() => setOpenItem({ kind: 'weapon', data: a })}>
                                    {a.name}
                                </button>
                            <div className="action-button-container">
                                <button type="button" className="btn btn-action btn-to-hit hover-grow" onClick={() => rollHit(a)}>{signed(a.hit ?? toHit)}</button>
                                <button type="button" className="btn btn-action damage-button hover-grow" onClick={() => rollDamage(a)}>{a.dice}{a.dmgMod ? signed(a.dmgMod) : ''}</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </li>

            <li className="action-item spell-slot">
                <span className="action-title" id="magical-actions-title">Magical Actions</span>
                <ul className="action-list" id="magical-actions-list">
                    {actionSpellsList.length === 0 ? (
                        <li className="action-item spell">No spells set as actions yet.</li>
                    ) : (
                        actionSpellsList.map((s) => (
                            <li key={s.id} className="action-item spell">
                                <button type="button" className="btn btn-spell-name hover-grow" onClick={() => setOpenItem({ kind: 'spell', data: s })}>
                                    {s.name}
                                </button>

                                <div className="action-button-container">
                                    {s.attack_type ? (
                                        <button type='button' className='btn btn-action btn-to-hit hover-grow'
                                        onClick={() => onCastClick(s, () => castSpell(s, `${character.name} casts ${s.name}! ...Chance to hit... ${d20() + spellToHit + (s.base_to_hit_modifier || 0)}!`))}>
                                            {signed(spellToHit + (s.base_to_hit_modifier || 0))}
                                        </button>
                                    ) : s.opponent_save_roll ? (
                                        <button type='button' className='btn btn-action btn-to-hit hover-grow' onClick={() => onCastClick(s, () => castSpell(s, `Target must make a ${s.opponent_save_roll} roll and roll higher than a ${spellSave}`))}>{s.opponent_save_roll} {spellSave}</button>
                                    ) : null}

                                    {(s.base_damage_dice) ? (
                                        // with a to-hit/save button the damage is just a roll; without one, this button is the cast
                                        <button type="button" className="btn btn-action damage-button hover-grow" onClick={() => (s.attack_type || s.opponent_save_roll) ? rollDamage({ dice: diceAt(s, castLevels[s.id] ?? s.base_level), dmgMod: s.dmgMod || 0 }) : onCastClick(s, () => castSpell(s, `${character.name} casts ${s.name}! Damage dealt: ${Math.max(0, rollDice(s.base_damage_dice) + (s.dmgMod || 0))}`))}>{diceAt(s, castLevels[s.id] ?? s.base_level)}{s.dmgMod ? signed(s.dmgMod) : ''}</button>
                                    ) : (
                                        <button type='button' className='btn btn-action damage-button hover-grow' onClick={() => onCastClick(s, () => castSpell(s, `${character.name} casts ${s.name}!`))}>Cast</button>
                                    )}

                                    {/* Level picker: shows after clicking a leveled spell's cast button */}
                                    {pickerFor === s.id && (
                                        <select className="upcast-picker" autoFocus defaultValue=""
                                            onChange={(e) => castAtLevel(s, Number(e.target.value))}
                                            onBlur={() => setPickerFor(null)}>
                                            <option value="" disabled>Cast at level...</option>
                                            {openSlotLevels(s).map((lvl) => (
                                                <option key={lvl} value={lvl}>Level {lvl}{diceAt(s, lvl) ? ` (${diceAt(s, lvl)})` : ''}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </li>

            <li className="action-item spell-slot">
                <span className="action-title" id="physical-actions-title">Bonus Actions</span>
                <ul className="action-list" id="physical-actions-list">
                    {bonusFeatures.map((f) => (
                            <li key={`${f.source}-${f.id}`} className="action-item spell">
                                <button type="button" className="btn btn-spell-name hover-grow" onClick={() => setOpenItem({ kind: 'feature', data: f })}>
                                    {f.name}
                                </button>
                                <div className="action-button-container">
                                    {f.dice && (
                                        <button type="button" className="btn btn-action damage-button hover-grow"
                                            onClick={() => onRoll(`${character.name} uses ${f.name}! Rolled: ${rollDice(f.dice)}`)}>
                                            {f.dice}
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-action damage-button hover-grow"
                                        onClick={() => onRoll(`${character.name} uses ${f.name}!`)}>
                                        Use
                                    </button>
                                </div>
                            </li>
                        ))}
                </ul>
            </li>

            <li className="action-item spell-slot">
                <span className="action-title" id="reactions-title">Reactions</span>
                <ul className="action-list" id="reactions-list">
                    {reactionFeatures.map((f) => (
                            <li key={`${f.source}-${f.id}`} className="action-item spell">
                                <button type="button" className="btn btn-spell-name hover-grow" onClick={() => setOpenItem({ kind: 'feature', data: f })}>
                                    {f.name}
                                </button>
                                <div className="action-button-container">
                                    {f.dice && (
                                        <button type="button" className="btn btn-action damage-button hover-grow"
                                            onClick={() => onRoll(`${character.name} uses ${f.name}! Rolled: ${rollDice(f.dice)}`)}>
                                            {f.dice}
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-action damage-button hover-grow"
                                        onClick={() => onRoll(`${character.name} uses ${f.name}!`)}>
                                        Use
                                    </button>
                                </div>
                            </li>
                        ))}
                </ul>
            </li>

            <li className="action-item spell-slot">
                <span className="action-title" id="feature-actions-title">Class Features</span>
                <ul className="action-list" id="feature-actions-list">
                    {actionFeatures.map((f) => (
                        <li key={`${f.source}-${f.id}`} className="action-item spell">
                            <button type="button" className="btn btn-spell-name hover-grow" onClick={() => setOpenItem({ kind: 'feature', data: f })}>
                                {f.name}
                            </button>
                            <div className="action-button-container">
                                {f.dice && (
                                    <button type="button" className="btn btn-action damage-button hover-grow"
                                        onClick={() => onRoll(`${character.name} uses ${f.name}! Rolled: ${rollDice(f.dice)}`)}>
                                        {f.dice}
                                    </button>
                                )}
                                <button type="button" className="btn btn-action damage-button hover-grow"
                                    onClick={() => onRoll(`${character.name} uses ${f.name}!`)}>
                                    Use
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </li>
            {openItem && createPortal(
                <article className="spell-details">
                    <button type='button' className='btn-round spell-details-close' onClick={() => setOpenItem(null)}>X</button>
                    <h3 className='spell-details-title'>{openItem.data.name}</h3>

                    {openItem.kind === 'feature' && (
                        <>
                            <section className="details-container">
                                <section className="combat-box">
                                    <article className="combat-box-title"><h4>Feature Details</h4></article>
                                    <article className="combat-box-content">
                                        <p>Level: <strong>{openItem.data.level}</strong></p>
                                        <p>Type: <strong>{ACTION_LABELS[openItem.data.action_type]}</strong></p>
                                    </article>
                                </section>
                                <section className="spell-build-box">
                                    <article className="spell-build-box-title"><h4>Usage</h4></article>
                                    <article className="spell-build-box-content">
                                        <p>Uses: <strong>{openItem.data.uses}</strong></p>
                                        {openItem.data.dice && <p>Dice: <strong>{openItem.data.dice}</strong></p>}
                                    </article>
                                </section>
                            </section>
                            <section className="spell-description-box">
                                <p><strong>Description:</strong> <br /> {openItem.data.description}</p>
                            </section>
                        </>
                    )}

                    {openItem.kind === 'spell' && (
                        <>
                            <section className="details-container">
                                <section className="combat-box">
                                    <article className="combat-box-title"><h4>Spell Details</h4></article>
                                    <article className="combat-box-content">
                                        <p>Range: <strong>{openItem.data.range ? `${openItem.data.range} ft` : 'Reach'}</strong></p>
                                        <p>Duration: <strong>{Number(openItem.data.duration) === 0 ? 'instant' : `${openItem.data.duration} turns`}</strong></p>
                                        <p>Cast Time: <strong>{openItem.data.casting_time ? `${openItem.data.casting_time} turn(s)` : ''}</strong></p>
                                    </article>
                                </section>
                                <section className="spell-build-box">
                                    <article className="spell-build-box-title"><h4>Incantation</h4></article>
                                    <article className="spell-build-box-content">
                                        <p>State: <strong>{openItem.data.state_name ? `${openItem.data.state_name}` : ''}</strong></p> 
                                        <p>Element: <strong>{openItem.data.element_name ? `${openItem.data.element_name}` : ''}</strong></p>
                                        <p>Alignment: <strong>{openItem.data.alignment_name ? `${openItem.data.alignment_name}` : ''}</strong></p>
                                    </article>
                                </section>
                            </section>
                            <section className="spell-description-box">
                                <p><strong>Description:</strong> <br /> {openItem.data.description}</p>
                            </section>
                        </>
                    )}

                    {openItem.kind === 'weapon' && (
                        <section className="details-container">
                            <section className="combat-box">
                                <article className="combat-box-title"><h4>To Hit</h4></article>
                                <article className="combat-box-content">
                                    <p><strong>{signed(openItem.data.hit ?? toHit)}</strong></p>
                                </article>
                            </section>
                            <section className="spell-build-box">
                                <article className="spell-build-box-title"><h4>Damage</h4></article>
                                <article className="spell-build-box-content">
                                    <p><strong>{openItem.data.dice}{openItem.data.dmgMod ? signed(openItem.data.dmgMod) : ''}</strong></p>
                                </article>
                            </section>
                        </section>
                    )}
                </article>
                , document.body)}
        </ul>
    );
}
export default Actions;
