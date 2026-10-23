import { useState } from 'react';
import { useParams } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import sheetSubpageCss from '../styles/sheet-subpage.css?inline';
import EditNameForm from './edit/EditNameForm';
import EditClassForm from './edit/EditClassForm';
import EditAbilitiesForm from './edit/EditAbilitiesForm';
import Loader from '../components/Loader';
import useTabSlider from '../hooks/useTabSlider';

const TABS = [
    { id: 'name', label: 'Name and Race' },
    { id: 'class', label: 'Class and Level' },
    { id: 'abilities', label: 'Abilities' },
];

// Replaces views/charEdit.ejs. Laid out like the character creator (char_create.css);
// sheet-subpage.css only adds the portrait picker, feature choices and class info boxes.
function EditCharacterPage() {
    usePageStyle(createCss + sheetSubpageCss, 'subpage');
    const { id } = useParams();
    const { data, setData, loading, error } = useFetch(`/api/characters/${id}/edit`);
    const [tab, setTab] = useState('name');
    const { tabProps, barProps, slideStyle } = useTabSlider(TABS.findIndex((t) => t.id === tab));

    // every form calls this with the saved character the server sends back
    const onSaved = (character) => setData((prev) => ({ ...prev, character }));

    if (loading) return <Loader />;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { character, races, classes, subClasses } = data;
    const current = TABS.find((t) => t.id === tab);

    return (
        <>
            <header id='site-title'>
                <h1>{character.name} - Character Editor</h1>
            </header>
            <div id='nav-container'>
                <h2>{current.label}</h2>
                <nav id="step-nav" role="tablist" {...barProps}>
                    {TABS.map((t, i) => (
                        <button key={t.id} type="button" role="tab" className="btn btn-step" id={`edit-tab-${t.id}`} aria-controls={`edit-panel-${t.id}`} aria-selected={tab === t.id} onClick={() => setTab(t.id)} {...tabProps(i)}>
                            {t.label}
                        </button>
                    ))}
                    <span className="slide" aria-hidden="true" style={slideStyle} />
                </nav>
            </div>
            <main>
                {/* rendered only when open: the wrappers use display:flex, which would override the hidden attribute */}
                {tab === 'name' && (
                    <div role="tabpanel" id="edit-panel-name" aria-labelledby="edit-tab-name" className="step-1-container-wrapper">
                        <section className="step-1-container">
                            <EditNameForm character={character} races={races} onSaved={onSaved} />
                        </section>
                    </div>
                )}
                {tab === 'class' && (
                    <div role="tabpanel" id="edit-panel-class" aria-labelledby="edit-tab-class" className="step-2-container-wrapper">
                        <section className="step-2-container">
                            <EditClassForm character={character} classes={classes} subClasses={subClasses} onSaved={onSaved} />
                        </section>
                    </div>
                )}
                {tab === 'abilities' && (
                    <div role="tabpanel" id="edit-panel-abilities" aria-labelledby="edit-tab-abilities" className="step-2-container-wrapper">
                        <section className="step-2-container">
                            <EditAbilitiesForm character={character} onSaved={onSaved} />
                        </section>
                    </div>
                )}
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default EditCharacterPage;