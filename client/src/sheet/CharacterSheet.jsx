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
import { getSpellSlots, scaledAt } from '../utils/spellSlots';
import { modOf, d20, proficiencyBonus } from '../utils/math';
import Loader from '../components/Loader';
import RestButton from './RestButton';
import socket from '../utils/socket';
import { utilityRuneEffects } from '../utils/runes'; /*prep-done*/

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
    const setTempHp = (t) =>
        setData((prev) => ({ ...prev, character: { ...prev.character, temp_hp: t } }));
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
    // Distance: (race base speed + Speed stat + Fleet Rune 5 ft) scaled by how healthy you are
    const fleetFt = utilityRuneEffects(ownedArmor, ownedWeapons).fleet ? 5 : 0;
    const distance = Math.round(((character.race_base_speed ?? 0) + (character.spd ?? 0) + fleetFt) * (character.max_hp ? hp / character.max_hp : 1));

    // Per-rest state is saved on the character row (PATCH /state), so it survives reloads
    const usedSlots = character.used_slots || {};
    const conditions = character.conditions || {};
    const exhaustion = character.exhaustion || 0;
    const embersSpent = character.embers_spent || 0;
    const restUses = character.rest_uses || {};   // { featureKey: uses spent since its recovery rest }
    const cracks = character.cracks || 0;
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
    const countUse = (key) => saveState({ rest_uses: { ...restUses, [key]: (restUses[key] || 0) + 1 } });

    const spendSlot = (lvl) => {
        if (lvl === 0) return true;
        const total = getSpellSlots(character.level, character.spell_slots)[lvl - 1] || 0;
        const used = usedSlots[lvl] || 0;
        if (used >= total) return false;
        setUsedSlots({ ...usedSlots, [lvl]: used + 1 });
        return true;
    };

    // Stolen Radiance pool (classes.has_embers): ceil(level / 2) + INT mod (min 1), + CON mod from level 17
    const embersMax = character.has_embers
        ? Math.max(1, Math.ceil(character.level / 2) + modOf(character.int) + (character.level >= 17 ? modOf(character.con) : 0))
        : 0;
    const embers = Math.max(0, embersMax - embersSpent);

    // Spend embers from the pool. false = not enough.
    const spendEmbers = (cost) => {
        if (cost > embers) return false;
        saveState({ embers_spent: embersSpent + cost });
        return true;
    };

    // Seal Cracks (classes.crack_max; NULL = no Crack track). Going past the max = Breach: CON save vs breach_dc, Cracks stay at max.
    const crackMax = character.crack_max || 0;
    const breachDc = scaledAt(character.breach_dc_scaling, 'dc', character.level, character.breach_dc);
    const conSave = modOf(character.con) + ((character.class_saving_throws || []).includes('CON') ? proficiencyBonus(character.level) : 0);
    const gainCracks = (n) => {
        if (!crackMax || n <= 0) return;
        const patch = { cracks: Math.min(crackMax, cracks + n) };
        const messages = [];
        for (let i = 0; i < cracks + n - crackMax; i++) {
            const roll = d20() + conSave;
            if (roll >= breachDc) {
                messages.push(`Breach! CON save ${roll} vs DC ${breachDc}: success, nothing happens.`);
            } else {
                messages.push(`Breach! CON save ${roll} vs DC ${breachDc}: failed. Stunned until the end of your next turn.${character.breach_effect ? ` ${character.breach_effect}` : ''}`);
                if (character.breach_drains_embers) patch.embers_spent = embersMax;
            }
        }
        saveState(patch);
        messages.forEach(showRoll);
    };
    const removeCracks = (n) => saveState({ cracks: Math.max(0, cracks - n) });

    // Slot-to-embers features (kindles_slot, e.g. Kindled Slot): spend one slot, regain embers = its level (capped at max)
    const kindleSlot = (lvl, key) => {
        if (restUses[key]) return showRoll('That feature is used until your next long rest.');
        if (!spendSlot(lvl)) return showRoll(`No level ${lvl} slots left!`);
        const gained = Math.min(lvl, embersSpent);
        saveState({ embers_spent: embersSpent - gained, rest_uses: { ...restUses, [key]: (restUses[key] || 0) + 1 } });
        showRoll(`${character.name} uses Kindled Slot (level ${lvl} slot): +${gained} embers (${embers + gained}/${embersMax})`);
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

    // temporary HP is gone after a long rest
    if (type === 'long' && character.temp_hp > 0) {
        const tr = await fetch(`/api/characters/${character.id}/temp-hp`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clear: true }),
        });
        if (tr.ok) setTempHp((await tr.json()).temp_hp);
    }

    const newSlots = {};
    for (const [lvl, used] of Object.entries(usedSlots)) {
        newSlots[lvl] = used - Math.round(used * pct);
    }

    const newConditions = {};
    for (const [name, on] of Object.entries(conditions)) {
        newConditions[name] = on && Math.random() >= pct;
    }
    // Uses per rest: a long rest resets all; a short rest resets only features that recover on a short rest
    const newUses = {};
    if (type !== 'long') {
        for (const f of actionFeatures) {
            const key = `${f.source}-${f.id}`;
            if (restUses[key] && f.rest_lock === 'long') newUses[key] = restUses[key];
        }
        // rune uses (Mending Rune) recover on a long rest only
        for (const [key, n] of Object.entries(restUses)) if (key.startsWith('rune-')) newUses[key] = n;
    }
    // embers: all back on a long rest, half the max on a short rest. One save for everything.
    saveState({
        used_slots: newSlots,
        conditions: newConditions,
        exhaustion: exhaustion - Math.round(exhaustion * pct),
        embers_spent: type === 'long' ? 0 : Math.max(0, embersSpent - Math.floor(embersMax / 2)),
        rest_uses: newUses,
        cracks: type === 'long' ? 0 : Math.max(0, cracks - 2),   // Mending: short rest -2 Cracks, long rest all
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
        embers,
        embersMax,
        spendEmbers,
        restUses,
        countUse,
        cracks,
        crackMax,
        gainCracks,
        removeCracks,
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
                    <HealthBox id={character.id} hp={hp} max={character.max_hp} temp={character.temp_hp ?? 0} onHpChange={setHp} onTempChange={setTempHp} />
                    <Conditions />
                    
                </section>
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
            <RollOrb open={orbOpen} rolls={rolls} onToggle={() => setOrbOpen((o) => !o)} />
        </CharacterContext.Provider>
    );
}

export default CharacterSheet;
