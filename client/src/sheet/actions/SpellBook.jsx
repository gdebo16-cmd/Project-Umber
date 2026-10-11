import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import TabList from '../../components/TabList';
import { sendJson } from '../../utils/api';

const TABS = [
    { id: 'level_0', label: 'Low Level' },
    { id: 'level_1', label: 'Level 1' },
    { id: 'level_2', label: 'Level 2' },
    { id: 'level_3', label: 'Level 3' },
    { id: 'level_4', label: 'Level 4' },
    { id: 'level_5', label: 'Level 5' },
    { id: 'level_6', label: 'Level 6' },
    { id: 'level_7', label: 'Level 7' },
    { id: 'level_8', label: 'Level 8' },
    { id: 'level_9', label: 'Level 9' },
];

function SpellBook({ characterId, onDone }) {
    const { data, setData, loading, error } = useFetch(`/api/characters/${characterId}/spellbook`);
    const [tab, setTab] = useState('level_0');
    const [saveError, setSaveError] = useState('');

const changeSpell = async (spellId, action) => {
    // action is 'learn' or 'unlearn'
    const url = `/api/characters/${characterId}/spells/${action}`;
    try {
        const learned = await sendJson(url, 'POST', { spell_id: spellId });
        setData((prev) => ({ ...prev, ...learned }));
        setSaveError('');
    } catch (err) {
        setSaveError(err.message);
    }
};

    const spellButton = (spellId, learned) => (
        learned ? (
            <>
                <em className='learnedSpell'>Learned</em>
                <form className='forgetSpellForm' onSubmit={(e) => { e.preventDefault(); changeSpell(spellId, 'unlearn'); }}>
                    <button type='submit' id='forget-spell-button' className='action-button hover-grow'>Forget</button>
                </form>           
            </>
        ) : (
            <form className='learnSpellForm' onSubmit={(e) => { e.preventDefault(); changeSpell(spellId, 'learn'); }}>
                <button type='submit' id='learn-spell-button' className='action-button hover-grow'>Learn</button>
            </form>
        )
    );

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { spells, learnedIds } = data;
    return (
        <>
        <section className="title-tile">
        <h3 className="action-title cap-top">Study Arcana</h3>
        <button type='button' className='link-button hover-grow' onClick={onDone}>Close the Book</button>
        {saveError && <p>{saveError}</p>}
        </section>
            
            <section className='panel-shell spell-book-tabs'>
                <TabList tabs={TABS} active={tab} onChange={setTab} prefix='spell-' />
                
                <article role='tabpanel' id='spell-panel-level_0' className='action-tile spell-panel' aria-labelledby='spell-tab-level_0' hidden={tab !== 'level_0'}>
                    <h3 className='action-title cap-top'>Low Level Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 0).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span>
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_1' className='action-tile spell-panel' aria-labelledby='spell-tab-level_1' hidden={tab !== 'level_1'}>
                    <h3 className='action-title cap-top'>Level 1 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 1).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span>
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_2' className='action-tile spell-panel' aria-labelledby='spell-tab-level_2' hidden={tab !== 'level_2'}>
                    <h3 className='action-title cap-top'>Level 2 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 2).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_3' className='action-tile spell-panel' aria-labelledby='spell-tab-level_3' hidden={tab !== 'level_3'}>
                    <h3 className='action-title cap-top'>Level 3 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 3).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_4' className='action-tile spell-panel' aria-labelledby='spell-tab-level_4' hidden={tab !== 'level_4'}>
                    <h3 className='action-title cap-top'>Level 4 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 4).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_5' className='action-tile spell-panel' aria-labelledby='spell-tab-level_5' hidden={tab !== 'level_5'}>
                    <h3 className='action-title cap-top'>Level 5 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 5).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}  
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_6' className='action-tile spell-panel' aria-labelledby='spell-tab-level_6' hidden={tab !== 'level_6'}>
                    <h3 className='action-title cap-top'>Level 6 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 6).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_7' className='action-tile spell-panel' aria-labelledby='spell-tab-level_7' hidden={tab !== 'level_7'}>
                    <h3 className='action-title cap-top'>Level 7 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 7).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>            
                <article role='tabpanel' id='spell-panel-level_8' className='action-tile spell-panel' aria-labelledby='spell-tab-level_8' hidden={tab !== 'level_8'}>
                    <h3 className='action-title cap-top'>Level 8 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 8).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
                <article role='tabpanel' id='spell-panel-level_9' className='action-tile spell-panel' aria-labelledby='spell-tab-level_9' hidden={tab !== 'level_9'}>   
                  <h3 className='action-title cap-top'>Level 9 Spells</h3>
                    <ul className='action-list spellList'>
                        {spells.filter(s => s.base_level === 9).map(s => (
                            <li key={s.id} className='action-item spell-item'>
                                <span className='action-label spellName'>{s.name}</span> 
                                {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                            </li>
                        ))}
                    </ul>
                </article>
            </section>
        </>
    );
};


export default SpellBook;