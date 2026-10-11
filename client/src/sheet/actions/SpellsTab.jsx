//import { rollDice } from '../../utils/math';
import { useState } from 'react';
import SpellBook from './SpellBook';
import { sendJson } from '../../utils/api';
import TabList from '../../components/TabList';
import { getSpellSlots } from '../../utils/spellSlots';
import { modOf, signed, proficiencyBonus } from '../../utils/math';


const SPELL_TABS = [
    { id: 'prepared', label: 'Prepared Spells' },
    { id: 'learned', label: 'Learned Spells' },
]

function SpellsTab({ characterId, learnedSpells, onSpellChange, level, spellStat, spellScore }) {
    const [error, setError] = useState('');
    const [browsing, setBrowsing] = useState(false);
    const base = `/api/characters/${characterId}/spells`;
    const [tab, setTab] = useState('prepared');
    const preparedSpells = learnedSpells.filter((s) => s.is_prepared);
    const slots = getSpellSlots(level);
    const spellAttack = modOf(spellScore) + proficiencyBonus(level);
    const spellSave = 8 + spellAttack;


    const spellAction = async (spellId, action) => {
        try {
            const data = await sendJson(`${base}/${action}`, 'POST', { spell_id: spellId });
            onSpellChange(data.learnedSpells);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const spellAtLevel = (list, lvl) => list.filter((s) => s.base_level === lvl);


    const finishBrowsing = async () => {
        try {
            const res = await fetch(`/api/characters/${characterId}`);
            const data = await res.json();
            onSpellChange(data.learnedSpells);
            setError('');
        } catch (err) {
            setError(err.message);
        }
        setBrowsing(false);
    };

    if (browsing) {
        return <SpellBook characterId={characterId} onDone={finishBrowsing} />;
    }

    return (

        <>
        <section className='title-tile'>
            <h2 className="action-tab-title" id="spell-title">Spell Book</h2>
            <article className="action-button-container">
            <p>{characterId}'s Spell Book</p>
            <button type='button' className='link-button hover-grow' onClick={() => setBrowsing(true)}>Consult the Scrolls</button>
            <p className='action-label'>{spellStat} . Attack {signed(spellAttack)} . Save {signed(spellSave)}</p>
            </article>
            
            {error && <p>{error}</p>}
        </section>

            <section className="panel-shell spells-tab">
            <TabList tabs={SPELL_TABS} active={tab} onChange={setTab} prefix="spells-" />

            
        <article role="tabpanel" id="spells-panel-prepared" className="action-tile spells-panel" aria-labelledby="spells-tab-prepared" hidden={tab !== 'prepared'}>
            <ul className="action-list spellList">
                {/* cantrips: same shape as the numbered levels below (wrapper li, title, list) */}
                <li className="action-item spell-slot">
                    <span className="action-title">Low Level Spells</span>
                    <ul className="action-list">
                        {spellAtLevel(preparedSpells, 0).map((s) => (
                            <li className="action-item spell" key={s.id}>
                                {s.name}
                                <article className="action-button-container">
                                    <button type='button' className='action-button hover-grow' onClick={() => spellAction(s.id, 'cast')}>Cast</button>
                                    <button type='button' className='action-button hover-grow' onClick={() => spellAction(s.id, 'damage')}>Damage</button>
                                </article>    
                            </li>
                        ))}
                    </ul>
                </li>
                {slots.map((count, i) => (
                    <li className="action-item spell-slot" key={i}>
                        <span className='action-title'>Level {i + 1} Spells <br />
                            {Array.from({ length: count }, (_, j) => (
                                <input key={j} type='checkbox' className='spell-slot-checkbox' /> 
                            ))}
                        </span>
                        <ul className="action-list">
                            {spellAtLevel(preparedSpells, i + 1).map((s) => (
                            <li className="action-item spell" key={s.id}>
                                {s.name}
                                <article className="action-button-container">
                                    <button type='button' className='action-button hover-grow' onClick={() => spellAction(s.id, 'cast')}>Cast</button>
                                    <button type='button' className='action-button hover-grow' onClick={() => spellAction(s.id, 'damage')}>Damage</button>
                                </article>    
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
                    <ul className="action-list spellList">
                    {learnedSpells.map((s) => (
                        <li className="action-item" key={s.id}>
                            {s.name} <br /> Level: {s.base_level}
                            <article className="action-button-container">
                            <form className="removeSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, 'unlearn'); }}>
                                <button type="submit" id="unlearn-spell-button" className="action-button hover-grow">Unlearn</button>
                            </form>
                            <form className="prepareSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, s.is_prepared ? 'unprepare' : 'prepare'); }}>
                                <button type="submit" className="action-button hover-grow">
                                    {s.is_prepared ? 'Unprepare' : 'Prepare'}
                                </button>
                            </form>
                        </article>
                    </li>
                    ))}
                </ul>
                )}
            </article>

            </section>
            </>
        );
    }

export default SpellsTab;
