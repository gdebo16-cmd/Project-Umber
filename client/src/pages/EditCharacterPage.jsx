import { useState } from 'react';
import { Link, useParams } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import sheetCss from '../styles/charSheet.css?inline';
import TabList from '../components/TabList';
import EditNameForm from './edit/EditNameForm';
import EditClassForm from './edit/EditClassForm';
import EditAbilitiesForm from './edit/EditAbilitiesForm';
import Loader from '../components/Loader';

const TABS = [
    { id: 'name', label: 'Name and Race' },
    { id: 'class', label: 'Class and Level' },
    { id: 'abilities', label: 'Abilities' },
];

// Replaces views/charEdit.ejs. Each tab is its own small form component in pages/edit/.
function EditCharacterPage() {
    usePageStyle(sheetCss, 'subpage', 'page-sheet');
    const { id } = useParams();
    const { data, setData, loading, error } = useFetch(`/api/characters/${id}/edit`);
    const [tab, setTab] = useState('name');

    // every form calls this with the saved character the server sends back
    const onSaved = (character) => setData((prev) => ({ ...prev, character }));

    if (loading) return <Loader />;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { character, races, classes, subClasses } = data;

    return (
        <>
            <header>
                <h1 className='' id="site-title">{character.name} - Character Editor</h1>
                <p className='btn btn-link' id="editLink"><Link to={`/characters/${character.id}`}>Back to character sheet</Link></p>
            </header>
            <main className="subpage-main">
                <section className="panel-shell">
                    <TabList tabs={TABS} active={tab} onChange={setTab} prefix="edit-" />

                    <article role="tabpanel" id="edit-panel-name" className="edit-panel" aria-labelledby="edit-tab-name" hidden={tab !== 'name'}>
                        <h2 className="title-tile">Name and Race</h2>
                        <EditNameForm character={character} races={races} onSaved={onSaved} />
                    </article>

                    <article role="tabpanel" id="edit-panel-class" className="edit-panel" aria-labelledby="edit-tab-class" hidden={tab !== 'class'}>
                        <h2 className="title-tile">Class, Subclass and Level</h2>
                        <EditClassForm character={character} classes={classes} subClasses={subClasses} onSaved={onSaved} />
                    </article>

                    <article role="tabpanel" id="edit-panel-abilities" className="edit-panel" aria-labelledby="edit-tab-abilities" hidden={tab !== 'abilities'}>
                        <h2 className="title-tile">Abilities</h2>
                        <EditAbilitiesForm character={character} onSaved={onSaved} />
                    </article>
                </section>
            </main>
        </>
    );
}

export default EditCharacterPage;
