import { useState } from 'react';
import { Link, useParams } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import sheetCss from '../styles/charSheet.css?inline';
import TabList from '../components/TabList';
import EditNameForm from './edit/EditNameForm';
import EditClassForm from './edit/EditClassForm';
import EditAbilitiesForm from './edit/EditAbilitiesForm';
import EditLevelForm from './edit/EditLevelForm';

const TABS = [
    { id: 'name', label: 'Name and Race' },
    { id: 'class', label: 'Class and Subclass' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'level', label: 'Character Level' },
];

// Replaces views/charEdit.ejs. Each tab is its own small form component in pages/edit/.
function EditCharacterPage() {
    usePageStyle(sheetCss, 'subpage');
    const { id } = useParams();
    const { data, setData, loading, error } = useFetch(`/api/characters/${id}/edit`);
    const [tab, setTab] = useState('name');

    // every form calls this with the saved character the server sends back
    const onSaved = (character) => setData((prev) => ({ ...prev, character }));

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { character, races, classes, subClasses } = data;

    return (
        <>
            <header>
                <h1 id="editTitle">{character.name} - Character Editor</h1>
                <p id="editLink"><Link to={`/characters/${character.id}`}>Back to character sheet</Link></p>
            </header>
            <main className="subpage-main">
                <section className="panel-shell">
                    <TabList tabs={TABS} active={tab} onChange={setTab} prefix="edit-" />

                    <article role="tabpanel" id="edit-panel-name" className="edit-panel" aria-labelledby="edit-tab-name" hidden={tab !== 'name'}>
                        <h2 className="tabTitle">Name and Race</h2>
                        <EditNameForm character={character} races={races} onSaved={onSaved} />
                    </article>

                    <article role="tabpanel" id="edit-panel-class" className="edit-panel" aria-labelledby="edit-tab-class" hidden={tab !== 'class'}>
                        <h2 className="tabTitle">Class and Subclass</h2>
                        <EditClassForm character={character} classes={classes} subClasses={subClasses} onSaved={onSaved} />
                    </article>

                    <article role="tabpanel" id="edit-panel-abilities" className="edit-panel" aria-labelledby="edit-tab-abilities" hidden={tab !== 'abilities'}>
                        <h2 className="tabTitle">Abilities</h2>
                        <EditAbilitiesForm character={character} onSaved={onSaved} />
                    </article>

                    <article role="tabpanel" id="edit-panel-level" className="edit-panel" aria-labelledby="edit-tab-level" hidden={tab !== 'level'}>
                        <h2 className="tabTitle">Character Level</h2>
                        <EditLevelForm character={character} onSaved={onSaved} />
                    </article>
                </section>
            </main>
        </>
    );
}

export default EditCharacterPage;
