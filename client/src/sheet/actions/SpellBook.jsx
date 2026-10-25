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

// Optional: if you want the panel titles to stay exact
const LEVEL_TITLES = {
    0: 'Low Level Spells',
    1: 'Level 1 Spells',
    2: 'Level 2 Spells',
    3: 'Level 3 Spells',
    4: 'Level 4 Spells',
    5: 'Level 5 Spells',
    6: 'Level 6 Spells',
    7: 'Level 7 Spells',
    8: 'Level 8 Spells',
    9: 'Level 9 Spells',
};

function SpellBook({ characterId, onDone, onOpenSpell }) {
    const { data, setData, loading, error } = useFetch(`/api/characters/${characterId}/spellbook`);
    const [tab, setTab] = useState('level_0');
    const [saveError, setSaveError] = useState('');

    const changeSpell = async (spellId, action) => {
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
                <em className="learned"></em>
                <form className="action-form" onSubmit={(e) => { e.preventDefault(); changeSpell(spellId, 'unlearn'); }}>
                    <button type="submit" id="forget-spell-button" className="action-button">Forget</button>
                </form>
            </>
        ) : (
            <form className="action-form" onSubmit={(e) => { e.preventDefault(); changeSpell(spellId, 'learn'); }}>
                <button type="submit" id="learn-spell-button" className="action-button">Learn</button>
            </form>
        )
    );

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { spells, learnedIds, learnedSpells = [], spellLimits } = data; /*prep-done*/
    const learnedLeveled = learnedSpells.filter((s) => s.base_level >= 1).length;
    const learnedCantrips = learnedSpells.filter((s) => s.base_level === 0 && !s.is_racial).length; // race starter spells are free
    const maxLevel = Math.max(0, ...spells.map((s) => s.base_level));
    const visibleTabs = TABS.filter((t) => Number(t.id.split('_')[1]) <= maxLevel);
    
    
    
return (
        <>
            <section className="title-tile">
                <h3 className="shop-title">Study Arcana</h3>
                <article className='book-bar'>
                    <button type="button" className="spellbook-button" onClick={onDone}>Close the Book</button>
                {spellLimits && <p className='spell-stat-book'>Learned: {learnedLeveled}/{spellLimits.known} Cantrips: {learnedCantrips}/{spellLimits.cantrips}</p>}
                {saveError && <p>{saveError}</p>}
                </article>
                
            </section>

            <section className="panel-shell spell-book-tabs">
                <TabList tabs={visibleTabs} active={tab} onChange={setTab} prefix="spell-" />

                {TABS.map(({ id }) => {
                    const level = Number(id.replace('level_', ''));
                    const levelSpells = spells.filter((s) => s.base_level === level);

                    return (
                        <article
                            key={id}
                            role="tabpanel"
                            id={`spell-panel-${id}`}
                            className="action-container"
                            aria-labelledby={`spell-tab-${id}`}
                            hidden={tab !== id}
                        >
                            <h3 className="action-title">{LEVEL_TITLES[level]}</h3>
                            <ul className="action-set">
                                {levelSpells.map((s) => (
                                    <li key={s.id} className="action-item">
                                        <button type="button" className="caption-btn hover-grow" onClick={() => onOpenSpell?.(s)}>{s.name}</button>
                                        {spellButton(s.id, learnedIds.includes(Number(s.id)))}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    );
                })}
            </section>
        </>
    );
}

export default SpellBook;

   
