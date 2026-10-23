import { useState } from 'react';
import TabList from '../../components/TabList';
import Actions from './Actions';
import SpellsTab from './SpellsTab';
import InventoryTab from './InventoryTab';
import ProficienciesTab from './ProficienciesTab';

const TABS = [
    { id: 'actions', label: 'Actions' },
    { id: 'spells', label: 'Spell Book' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'proficiencies', label: 'Proficiencies' },
];

// The big box with Actions / Spells / Inventory / Proficiencies tabs.
// Each tab gets its own data from useCharacter(), so nothing is passed down here.
function ActionPanel() {
    const [tab, setTab] = useState('actions');

    return (
        <section className="action-container" id="action-panel-container">
            <TabList className='action-tabs' tabs={TABS} active={tab} onChange={setTab} prefix="" />

            <article role="tabpanel" id="panel-actions" aria-labelledby="tab-actions" hidden={tab !== 'actions'}>
                <Actions />
            </article>

            <article role="tabpanel" id="panel-spells" aria-labelledby="tab-spells" hidden={tab !== 'spells'}>
                <SpellsTab />
            </article>

            <article role="tabpanel" id="panel-inventory" aria-labelledby="tab-inventory" hidden={tab !== 'inventory'}>
                <InventoryTab />
            </article>

            <article role="tabpanel" id="panel-proficiencies" aria-labelledby="tab-proficiencies" hidden={tab !== 'proficiencies'}>
                <ProficienciesTab />
            </article>
        </section>
    );
}

export default ActionPanel;
