//import { rollDice } from './math';
import { useState } from 'react';
import SpellBook from './SpellBook';
import { sendJson } from './api';
import TabList from './TabList';

// Same placeholder layout as character.ejs: spell levels 0-9, slot checkboxes,
// and a sample "Spell 6d8" row on levels 4-9. Nothing here is loaded from the database yet.
/* const SPELL_LEVELS = [
    { level: 0, slots: 0, sample: false },
    { level: 1, slots: 2, sample: false },
    { level: 2, slots: 2, sample: false },
    { level: 3, slots: 2, sample: false },
    { level: 4, slots: 2, sample: true },
    { level: 5, slots: 1, sample: true },
    { level: 6, slots: 1, sample: true },
    { level: 7, slots: 1, sample: true },
    { level: 8, slots: 1, sample: true },
    { level: 9, slots: 1, sample: true },
]; */

const SPELL_TABS = [
    { id: 'prepared', label: 'Prepared Spells' },
    { id: 'learned', label: 'Learned Spells' },
]

function SpellsTab({ characterId, learnedSpells, onSpellChange }) {
    const [error, setError] = useState('');
    const [browsing, setBrowsing] = useState(false);
    const base = `/api/characters/${characterId}/spells`;
    const [tab, setTab] = useState('prepared');
    const preparedSpells = learnedSpells.filter((s) => s.is_prepared);

    const spellAction = async (spellId, action) => {
        try {
            const data = await sendJson(`${base}/${action}`, 'POST', { spell_id: spellId });
            onSpellChange(data.learnedSpells);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

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
            <h2 className="tabTitle" id="spellsTitle">Spell Book</h2>
            <p id='spellLink'><button type='button' className='hover-grow' onClick={() => setBrowsing(true)}>Consult the Scrolls</button></p>
            {error && <p>{error}</p>}
            
            <section className="panel-shell spells-tab">
            <TabList tabs={SPELL_TABS} active={tab} onChange={setTab} prefix="spells-" />

            <article role="tabpanel" id="spells-panel-prepared" className="spells-panel" aria-labelledby="spells-tab-prepared" hidden={tab !== 'prepared'}>
                <h3 className="cap-top" id="preparedTitle">Prepared Spells</h3>
                {preparedSpells.length === 0 ? (
                    <p>No spells prepared.</p>
                ) : (
                    <ul className="spellList">
                        {preparedSpells.map((s) => (
                            <li key={s.id}>
                                {s.name} ({s.base_level})
                                {/* everything in preparedSpells is already prepared, so only Unprepare is needed */}
                                <form className="removeSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, 'unprepare'); }}>
                                    <button type="submit" className="unprepareSpellButton hover-grow">Unprepare</button>
                                </form>
                            </li>
                        ))}
                    </ul>
                )}
            </article>
            <article role="tabpanel" id="spells-panel-learned" aria-labelledby="spells-tab-learned" hidden={tab !== 'learned'}>
                <h3 className="cap-top" id="learnedTitle">Learned Spells</h3>
                {learnedSpells.length === 0 ? (
                    <p>You know nothing of magic.</p>
                ) : (
                    <ul className="spellList">
                    {learnedSpells.map((s) => (
                        <li key={s.id}>
                            {s.name} ({s.base_level})
                            {/* everything in learnedSpells is already learned, so only Unlearn is needed */}
                            <form className="removeSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, 'unlearn'); }}>
                                <button type="submit" className="unlearnSpellButton hover-grow">Unlearn</button>
                            </form>
                            <form className="prepareSpellForm" onSubmit={(e) => { e.preventDefault(); spellAction(s.id, 'prepare'); }}>
                                <button type="submit" className="prepareSpellButton hover-grow">Prepare</button>
                            </form>
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
