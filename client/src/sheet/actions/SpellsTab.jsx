//import { rollDice } from '../../utils/math';
import { useState } from 'react';
import SpellBook from './SpellBook';
import { sendJson } from '../../utils/api';
import TabList from '../../components/TabList';
import { getSpellSlots, beamsAt, beamRollText } from '../../utils/spellSlots';
import { modOf, signed, proficiencyBonus, rollDice, d20 } from '../../utils/math';
import { useCharacter } from '../CharacterContext';
import { createPortal } from 'react-dom';


const SPELL_TABS = [
    { id: 'prepared', label: 'Prepared Spells' },
    { id: 'learned', label: 'Learned Spells' },
]

function SpellsTab() {
    const { character, onRoll, learnedSpells, setLearnedSpells, usedSlots, setUsedSlots, spendSlot } = useCharacter();
    const characterId = character.id;
    const level = character.level;
    const spellStat = character.spell_stat;
    const spellScore = character[(character.casting_stat || character.spell_stat || '').toLowerCase()];
    const [error, setError] = useState('');
    const [browsing, setBrowsing] = useState(false);
    const base = `/api/characters/${characterId}/spells`;
    const [tab, setTab] = useState('prepared');
    const preparedSpells = learnedSpells.filter((s) => s.is_prepared);
    const slots = getSpellSlots(level, character.spell_slots);
    const spellAttack = modOf(spellScore) + proficiencyBonus(level);
    const spellSave = 8 + spellAttack;
    const [openSpell, setOpenSpell] = useState(null);

   


    const spellAction = async (spellId, action) => {
        try {
            const data = await sendJson(`${base}/${action}`, 'POST', { spell_id: spellId });
            setLearnedSpells(data.learnedSpells);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const spellAtLevel = (list, lvl) => list.filter((s) => s.base_level === lvl);
    const upcastsAtLevel = (list, lvl) =>
        list.flatMap((s) =>
            (s.upcasts || [])
                .filter((u) => u.cast_level === lvl)
                .map((u) => ({ ...s, ...u, upcastKey: `${s.id}-up${lvl}` }))
        );

    const spellButtons = (s, dice) => {
        const toHit = spellAttack + (s.base_to_hit_modifier || 0);
        const lvl = s.cast_level ?? s.base_level;          // upcast tiles cast at the level they sit under
        const who = character?.name ?? 'You';
        const hasFirst = s.attack_type || s.opponent_save_roll;

        // Uses one slot at this level, then shows the message. Stops if none are left.
        const cast = (message) => {
            if (!spendSlot(lvl)) return onRoll?.(`No level ${lvl} slots left!`);
            onRoll?.(message);
        };
        const damageText = () => `${s.heal_dice && !s.damage_dice && !s.base_damage_dice ? 'Healed' : 'Damage dealt'}: ${rollDice(dice)}`;

        return (
            <>
                {/* the first button you click spends the slot */}
                {s.attack_type ? (
                    <button type='button' className='btn btn-action btn-to-hit hover-grow' onClick={() => cast(beamsAt(s, level) > 1 ? `${who} casts ${s.name}! ${beamRollText(beamsAt(s, level), toHit, dice)}` : `${who} casts ${s.name}! Chance to hit: ${d20() + toHit}!`)}>{signed(toHit)}</button>
                ) : s.opponent_save_roll ? (
                    <button type='button' className='btn btn-action btn-to-hit hover-grow' onClick={() => cast(`${who} casts ${s.name}! Target mus make a ${s.opponent_save_roll} roll and beat a ${spellSave}!`)}>{s.opponent_save_roll} {spellSave}</button>
                ) : null}
                {dice ? (
                    // with a to-hit/save button the damage is just a roll; without one, this button is the cast
                    <button type='button' className='btn btn-action damage-button hover-grow' onClick={() => hasFirst ? onRoll?.(damageText()) : cast(`${who} casts ${s.name}! ${damageText()}`)}>{dice}</button>
                ) : (
                    <button type='button' className='btn btn-action damage-button hover-grow' onClick={() => cast(`${who} casts ${s.name}!`)}>Cast</button>
                )}
            </>
        );
    };


    const finishBrowsing = async () => {
        try {
            const res = await fetch(`/api/characters/${characterId}`);
            const data = await res.json();
            setLearnedSpells(data.learnedSpells);
            setError('');
        } catch (err) {
            setError(err.message);
        }
        setBrowsing(false);
    };

    // the details popup, shared by the spell lists and the Spell Book
    const spellDetails = openSpell && createPortal(
                <article className="spell-details">
                    <button type='button' className='btn-round spell-details-close' onClick={() => setOpenSpell(null)}>X</button>
                    <h3 className='spell-details-title'>{openSpell.name}</h3>
                    <section className='details-container'>
                    <section className='combat-box'>
                     <article className='combat-box-title'>
                        <h4>Spell Details</h4>
                     </article> 
                     <article className='combat-box-content'>
                        <p>Range: <strong>{openSpell.range ? `${openSpell.range} ft` : 'Reach'}</strong></p>
                        <p>Duration: <strong>{Number(openSpell.duration) === 0 ? 'instant' : `${openSpell.duration} turns`}</strong></p>
                        <p>Cast Time: <strong>{openSpell.casting_time ? `${openSpell.casting_time} turn(s)` : '1 turn(s)'}</strong></p>
                     </article>
                    </section>
                    <section className='spell-build-box'>
                    <article className='spell-build-box-title'>
                        <h4>Incantation</h4>
                     </article> 
                     <article className='spell-build-box-content'>
                            <p>State: <strong>{openSpell.state_name ? `${openSpell.state_name}` : ''}</strong></p>
                            <p>Element: <strong>{openSpell.element_name ? `${openSpell.element_name}` : ''}</strong></p>
                            <p>Alignment: <strong>{openSpell.alignment_name ? `${openSpell.alignment_name}` : ''}</strong></p>
                        </article>
                    </section>
                    </section>
                    <section className='spell-description-box'>
                        <p> <strong>Description:</strong> {openSpell.description}</p>
                    </section>
                </article>
    , document.body);

    if (browsing) {
        return (<>
            <SpellBook characterId={characterId} onDone={finishBrowsing} onOpenSpell={setOpenSpell} />
            {spellDetails}
        </>);
    }

    return (

        <>
        <section className='title-tile'>
            <h2 className="action-tab-title" id="spell-title">Spell Book</h2>
            <article className="action-button-container spell-stat-bar">
                <button type='button' className='btn btn-link hover-grow' onClick={() => setBrowsing(true)}>Consult the Scrolls</button>
                <p className="spell-stat">Primary Stat: {spellStat}</p>
                <p className="spell-stat">Damage Bonus: {signed(spellAttack)} </p>
                <p className="spell-stat">Target Save: {signed(spellSave)}</p>
            </article>
            
            {error && <p>{error}</p>}
        </section>

        <section className="panel-shell spells-tab">
        <TabList tabs={SPELL_TABS} active={tab} onChange={setTab} prefix="spells-" />

            
        <article role="tabpanel" id="spells-panel-prepared" className="action-tile spells-panel" aria-labelledby="spells-tab-prepared" hidden={tab !== 'prepared'}>
            <ul className="action-list spell-list">
                <li className="action-item spell-slot">
                    <span className="action-title">Low Level Spells</span>
                    <ul className="action-list">
                        {spellAtLevel(preparedSpells, 0).map((s) => (
                            <li className="action-item spell" key={s.id}>
                                <button type='button' className='btn btn-spell-name hover-grow' onClick={() => setOpenSpell(s)}>{s.name}</button>
                                    <article className="action-button-container">{spellButtons(s, s.base_damage_dice)}</article>
                            </li>
                        ))}
                    </ul>
                </li>
                {slots.map((count, i) => (
                    <li className="action-item spell-slot" key={i}>
                        <span className='action-title'>Level {i + 1} Spells <br />
                            {Array.from({ length: count }, (_, j) => (
                                <input key={j} type='checkbox' className='spell-slot-checkbox'
                                checked={j < (usedSlots[i + 1] || 0)}
                                onChange={(e) => setUsedSlots({ ...usedSlots, [i + 1]: e.target.checked ? j + 1 : j })} />
                            ))}
                        </span>
                        <ul className="action-list">
                            {spellAtLevel(preparedSpells, i + 1).map((s) => (
                            <li className="action-item spell" key={s.id}>
                                <button type='button' className='btn btn-spell-name hover-grow' onClick={() => setOpenSpell(s)}>{s.name}</button>
                                    <article className="action-button-container">{spellButtons(s, s.base_damage_dice)}</article>
                            </li>
                             ))}
                            {upcastsAtLevel(preparedSpells, i + 1).map((s) => (
                            <li className="action-item spell upcast-spell" key={s.upcastKey}>
                                <button type='button' className='btn btn-spell-name hover-grow' onClick={() => setOpenSpell(s)}>{s.name}</button>
                                    <article className="action-button-container">{spellButtons(s, s.damage_dice || s.heal_dice)}</article>
                            </li>
                            ))}
                        </ul>
                    </li>
                ))}   
            </ul>
        </article>
        <article role="tabpanel" className="action-tile spells-panel" id="spells-panel-learned" aria-labelledby="spells-tab-learned" hidden={tab !== 'learned'}>
                {learnedSpells.length === 0 ? (
                    <p>You know nothing of magic.</p>
                ) : (
                    <ul className="action-list spell-list">
                    {learnedSpells.map((s) => (
                        <li className="action-item" key={s.id}>
                            {s.name} <br /> Level: {s.base_level}
                            <article className="action-button-container">
                            <form className="removeSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, 'unlearn'); }}>
                                <button type="submit" id="unlearn-spell-button" className="btn btn-action hover-grow">Unlearn</button>
                            </form>
                            <form className="prepareSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, s.is_prepared ? 'unprepare' : 'prepare'); }}>
                                <button type="submit" className="btn btn-action hover-grow">
                                    {s.is_prepared ? 'Unprepare' : 'Prepare'}
                                </button>
                            </form>
                            <form className='setActionForm' onSubmit={(e) => { e.preventDefault(); spellAction(s.id, s.is_action ? 'removeAction' : 'setAction'); }}>
                                <button type="submit" className="btn btn-action hover-grow">
                                    {s.is_action ? 'Remove Action' : 'Set Action'}
                                </button>
                            </form>
                        </article>
                    </li>
                    ))}
                </ul>
                )}
            </article>

            {spellDetails}
          

            </section>
            </>
        );
    }

export default SpellsTab;
