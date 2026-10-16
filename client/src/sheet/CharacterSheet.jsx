import { useEffect, useState } from 'react';
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
import { CharacterContext } from './CharacterContext';
import { STATS } from '../utils/stats';
import { getSpellSlots } from '../utils/spellSlots';
import { modOf } from '../utils/math';
import Loader from '../components/Loader';
import RestButton from './RestButton';
import socket from '../utils/socket';

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
    const [rolls, setRolls] = useState([]);
    const [orbOpen, setOrbOpen] = useState(false);

    useEffect(() => {
        socket.connect();
        const onConnect = () => socket.emit('join-sheet', id);
        socket.on('connect', onConnect);
        const onRoll = (roll) => {
            setRolls((prev) => [...prev,{ ...roll, mine: false }].slice(-20));
        };
        socket.on('roll', onRoll);
        return () => {
            socket.off('roll', onRoll);
            socket.off('connect', onConnect);
            socket.disconnect();
        };
    }, [id]);



    const setHp = (newHp) =>
        setData((prev) => ({ ...prev, character: { ...prev.character, current_hp: newHp } }));
    const setOwnedArmor = (ownedArmor) => setData((prev) => ({ ...prev, ownedArmor }));
    const setOwnedWeapons = (ownedWeapons) => setData((prev) => ({ ...prev, ownedWeapons }));
    const setLearnedSpells = (learnedSpells) => setData((prev) => ({ ...prev, learnedSpells }));

    // Every roll on the sheet goes through here: show the text and pop the orb open
    const showRoll = (label) => {
        socket.emit('roll', label);
        setRolls((prev) => [...prev, {mine: true, name: 'You', label, at: Date.now()}].slice(-20));
        setOrbOpen(true);
    };

    if (loading) return <Loader />;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { character, ownedArmor, ownedWeapons, learnedSpells = [], actionFeatures = [] } = data;
    const hp = character.current_hp;
    // Distance: (race base speed + Speed stat) scaled by how healthy you are
    const distance = Math.round(((character.race_base_speed ?? 0) + (character.spd ?? 0)) * (character.max_hp ? hp / character.max_hp : 1));

    // Per-rest state is saved on the character row (PATCH /state), so it survives reloads
    const usedSlots = character.used_slots || {};
    const conditions = character.conditions || {};
    const exhaustion = character.exhaustion || 0;
    const radianceSpent = character.radiance_spent || 0;
    const restLocks = character.rest_locks || {};
    const saveState = (patch) => {
        setData((prev) => ({ ...prev, character: { ...prev.character, ...patch } }));
        fetch(`/api/characters/${character.id}/state`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
    };
    const setUsedSlots = (used_slots) => saveState({ used_slots });
    const setConditions = (v) => saveState({ conditions: typeof v === 'function' ? v(conditions) : v });
    const setExhaustion = (exhaustion) => saveState({ exhaustion });
    const lockFeature = (key) => saveState({ rest_locks: { ...restLocks, [key]: true } });

    const spendSlot = (lvl) => {
        if (lvl === 0) return true;
        const total = getSpellSlots(character.level, character.spell_slots)[lvl - 1] || 0;
        const used = usedSlots[lvl] || 0;
        if (used >= total) return false;
        setUsedSlots({ ...usedSlots, [lvl]: used + 1 });
        return true;
    };

    // Stolen Radiance pool (classes.has_radiance): ceil(level / 2) + INT mod (min 1), + CON mod from level 17
    const radianceMax = character.has_radiance
        ? Math.max(1, Math.ceil(character.level / 2) + modOf(character.int) + (character.level >= 17 ? modOf(character.con) : 0))
        : 0;
    const radiance = Math.max(0, radianceMax - radianceSpent);

    // Spend Radiance from the pool. false = not enough.
    const spendRadiance = (cost) => {
        if (cost > radiance) return false;
        saveState({ radiance_spent: radianceSpent + cost });
        return true;
    };

    // Slot-to-Radiance features (kindles_slot, e.g. Kindled Slot): spend one slot, regain Radiance = its level (capped at max)
    const kindleSlot = (lvl, key) => {
        if (restLocks[key]) return showRoll('That feature is used until your next long rest.');
        if (!spendSlot(lvl)) return showRoll(`No level ${lvl} slots left!`);
        const gained = Math.min(lvl, radianceSpent);
        saveState({ radiance_spent: radianceSpent - gained, rest_locks: { ...restLocks, [key]: true } });
        showRoll(`${character.name} uses Kindled Slot (level ${lvl} slot): +${gained} Radiance (${radiance + gained}/${radianceMax})`);
    };

    const rest = async (type) => {
        const pct = type === 'long' ? 1 : 0.2 + Math.random() * 0.4;
        
        const healAmount = Math.round((character.max_hp - hp) * pct);
        if (healAmount > 0) {
            const res = await fetch(`/api/characters/${character.id}/hp`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'heal' , amount: healAmount 
                }),

            });
            if (res.ok) setHp((await res.json()).current_hp);
    }

    const newSlots = {};
    for (const [lvl, used] of Object.entries(usedSlots)) {
        newSlots[lvl] = used - Math.round(used * pct);
    }

    const newConditions = {};
    for (const [name, on] of Object.entries(conditions)) {
        newConditions[name] = on && Math.random() >= pct;
    }
    // Once-per-rest locks: a long rest clears all; a short rest clears only the short-rest ones
    const newLocks = {};
    if (type !== 'long') {
        for (const f of actionFeatures) {
            const key = `${f.source}-${f.id}`;
            if (restLocks[key] && f.rest_lock === 'long') newLocks[key] = true;
        }
    }
    // Radiance: all back on a long rest, half the max on a short rest. One save for everything.
    saveState({
        used_slots: newSlots,
        conditions: newConditions,
        exhaustion: exhaustion - Math.round(exhaustion * pct),
        radiance_spent: type === 'long' ? 0 : Math.max(0, radianceSpent - Math.floor(radianceMax / 2)),
        rest_locks: newLocks,
    });

    return Math.round(pct * 100);
};

    
    // Everything the Actions panel tabs share. They read it with useCharacter() instead of props.
    const sheetData = {
        character,
        hp,
        ownedArmor,
        ownedWeapons,
        setOwnedArmor,
        setOwnedWeapons,
        learnedSpells,
        actionFeatures,
        setLearnedSpells,
        onRoll: showRoll,
        usedSlots,
        setUsedSlots,
        spendSlot,
        conditions,
        setConditions,
        exhaustion,
        setExhaustion,
        rest,
        radiance,
        radianceMax,
        spendRadiance,
        restLocks,
        lockFeature,
        kindleSlot,
    };

    return (
        <CharacterContext.Provider value={sheetData}>
            <CharacterHeader character={character} />
            <main>
                <TabList
                    tabs={SHEET_TABS}
                    active={sheetTab}
                    onChange={setSheetTab}
                    prefix="sheet-"
                    className="sheet-tabs action-tab-list"
                    hidden
                />

                <section role="tabpanel" id="sheet-panel-stats" className="sheet-panel" hidden={sheetTab !== 'stats'}>
                    <section className="container" id="stat-container">
                        {STATS.map((s) => (
                            <StatBox key={s.key} label={s.label} score={character[s.key]} bottom={s.key === 'spd' ? distance : undefined} onRoll={showRoll} />
                        ))}
                    </section>
                    <Skills character={character} onRoll={showRoll} />
                </section>

                <section role="tabpanel" id="sheet-panel-actions" className="sheet-panel" hidden={sheetTab !== 'actions'}>
                    <ArmorClass character={character} ownedArmor={ownedArmor} />
                    <Initiative character={character} hp={hp} onRoll={showRoll} />
                    <ActionPanel />
                </section>

                <section role="tabpanel" id="sheet-panel-conditions" className="sheet-panel" hidden={sheetTab !== 'conditions'}>
                    <RestButton />
                    <HealthBox id={character.id} hp={hp} max={character.max_hp} onHpChange={setHp} />
                    <Conditions />
                    
                </section>
            </main>
            <RollOrb open={orbOpen} rolls={rolls} onToggle={() => setOrbOpen((o) => !o)} />
        </CharacterContext.Provider>
    );
}

export default CharacterSheet;
