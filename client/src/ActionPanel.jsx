import { useState } from 'react';
import TabList from './TabList';
import Actions from './Actions';
import SpellsTab from './SpellsTab';
import InventoryTab from './InventoryTab';
import ProficienciesTab from './ProficienciesTab';

const TABS = [
    { id: 'actions', label: 'Actions' },
    { id: 'spell Book', label: 'Spell Book' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'equipment', label: 'Proficiencies' },
];

// The big box with Actions / Spells / Inventory / Proficiencies tabs
function ActionPanel({ character, hp, ownedArmor, ownedWeapons, onArmorChange, onWeaponsChange, learnedSpells, onSpellChange, onRoll }) {
    const [tab, setTab] = useState('actions');

    return (
        <section className="action">
            <TabList tabs={TABS} active={tab} onChange={setTab} prefix="" />

            <article role="tabpanel" id="panel-actions" aria-labelledby="tab-actions" hidden={tab !== 'actions'}>
                <Actions character={character} hp={hp} ownedWeapons={ownedWeapons} onRoll={onRoll} />
            </article>

            <article role="tabpanel" id="panel-spells" aria-labelledby="tab-spells" hidden={tab !== 'spell Book'}>
                <SpellsTab characterId={character.id} learnedSpells={learnedSpells} onSpellChange={onSpellChange} />
            </article>

            <article role="tabpanel" id="panel-inventory" aria-labelledby="tab-inventory" hidden={tab !== 'inventory'}>
                <InventoryTab
                    characterId={character.id}
                    ownedArmor={ownedArmor}
                    ownedWeapons={ownedWeapons}
                    onArmorChange={onArmorChange}
                    onWeaponsChange={onWeaponsChange}
                />
            </article>

            <article role="tabpanel" id="panel-equipment" aria-labelledby="tab-equipment" hidden={tab !== 'equipment'}>
                <ProficienciesTab />
            </article>
        </section>
    );
}

export default ActionPanel;
