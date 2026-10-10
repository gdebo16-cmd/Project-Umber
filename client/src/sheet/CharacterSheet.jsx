import { useState } from 'react';
import { useParams } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import sheetCss from '../styles/charSheet.css?inline';
import TabList from '../components/TabList';
import CharacterHeader from './CharacterHeader';
import StatBox from './StatBox';
import Skills from './Skills';
import ArmorClass from './ArmorClass';
import Initiative from './Initiative';
import ActionPanel from './actions/ActionPanel';
import HealthBox from './HealthBox';
import Conditions from './Conditions';
import RollOrb from './RollOrb';
import { STATS } from '../utils/stats';

// Mobile only: the three big tabs at the top. On desktop the CSS shows all three panels at once.
const SHEET_TABS = [
    { id: 'stats', label: 'Stat Rolls' },
    { id: 'actions', label: 'Combat' },
    { id: 'conditions', label: 'Character Condition' },
];

function CharacterSheet() {
    usePageStyle(sheetCss);
    const { id } = useParams();
    const { data, setData, loading, error } = useFetch(`/api/characters/${id}`);
    const [sheetTab, setSheetTab] = useState('stats');
    const [rollLabel, setRollLabel] = useState(''); // what the roll orb shows
    const [orbOpen, setOrbOpen] = useState(false);

    // Children call these to change the data everything else reads from
    const setHp = (newHp) =>
        setData((prev) => ({ ...prev, character: { ...prev.character, current_hp: newHp } }));
    const setOwnedArmor = (ownedArmor) => setData((prev) => ({ ...prev, ownedArmor }));
    const setOwnedWeapons = (ownedWeapons) => setData((prev) => ({ ...prev, ownedWeapons }));
    const setLearnedSpells = (learnedSpells) => setData((prev) => ({ ...prev, learnedSpells }));

    // Every roll on the sheet goes through here: show the text and pop the orb open
    const showRoll = (label) => {
        setRollLabel(label);
        setOrbOpen(true);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { character, ownedArmor, ownedWeapons, learnedSpells = [] } = data;
    const hp = character.current_hp;

    return (
        <>
            <CharacterHeader character={character} />
            <main>
                <TabList
                    tabs={SHEET_TABS}
                    active={sheetTab}
                    onChange={setSheetTab}
                    prefix="sheet-"
                    className="sheet-tabs tab-list"
                    hidden
                />

                <section role="tabpanel" id="sheet-panel-stats" className="sheet-panel" hidden={sheetTab !== 'stats'}>
                    <section className="base-stats">
                        {STATS.map((s) => (
                            <StatBox key={s.key} label={s.label} score={character[s.key]} onRoll={showRoll} />
                        ))}
                    </section>
                    <Skills character={character} onRoll={showRoll} />
                </section>

                <section role="tabpanel" id="sheet-panel-actions" className="sheet-panel" hidden={sheetTab !== 'actions'}>
                    <ArmorClass character={character} ownedArmor={ownedArmor} />
                    <Initiative character={character} hp={hp} onRoll={showRoll} />
                    <ActionPanel
                        character={character}
                        hp={hp}
                        ownedArmor={ownedArmor}
                        ownedWeapons={ownedWeapons}
                        onArmorChange={setOwnedArmor}
                        onWeaponsChange={setOwnedWeapons}
                        learnedSpells={learnedSpells}
                        onSpellChange={setLearnedSpells}
                        onRoll={showRoll}
                    />
                </section>

                <section role="tabpanel" id="sheet-panel-conditions" className="sheet-panel" hidden={sheetTab !== 'conditions'}>
                    <HealthBox id={character.id} hp={hp} max={character.max_hp} onHpChange={setHp} />
                    <Conditions />
                </section>
            </main>
            <RollOrb open={orbOpen} label={rollLabel} onToggle={() => setOrbOpen(!orbOpen)} />
        </>
    );
}

export default CharacterSheet;
