import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import CreateDescription from './CreateDescription';

// Replaces views/create_char_step2.ejs (step 2: class and subclass)
// Builds what the description box shows for a class: dropdown sections + feature tree
function classSections(c, subs) {
    return [
        { label: 'Description', body: c.description },
        { label: 'Spellcasting Ability', body: c.spellcasting_stat ? `${c.spellcasting_stat} - ${c.spellcasting}` : c.spellcasting },
        { label: 'Subclasses', body: subs.length ? subs.map((s) => s.name).join('\n') : 'Loading...' },
        { label: 'Stat Details', body: `Primary stat: ${c.primary_stat}\nHit die: ${c.hitpoint_die}` },
        { label: 'Armor & Weapons', body: `Armor: ${c.armor_proficiencies ?? '-'}\nWeapons: ${c.weapon_proficiencies ?? '-'}` },
        { label: 'Tools', body: c.tool_proficiencies ?? '-' },
    ];
}
function classShown(c, subs) {
    return { img: c.img_url, name: c.name, hideTitle: true, sections: classSections(c, subs), features: c.features };
}

function CreateStep2() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { data: classes, loading, error } = useFetch('/api/create_char/step2');
    const [classId, setClassId] = useState('');
    const [subclasses, setSubclasses] = useState([]);
    const [subclassId, setSubclassId] = useState('');
    const [shown, setShown] = useState(null); // what the description box shows
    const [saveError, setSaveError] = useState('');

    const changeClass = async (e) => {
        const id = e.target.value;
        const picked = classes.find((c) => String(c.id) === id);
        setClassId(id);
        setSubclassId('');
        setShown(classShown(picked, []));

        // load this class's subclasses (same as char_step2.js did)
        const res = await fetch(`/api/create_char/subclasses/${id}`);
        if (!res.ok) {
            setSaveError('could not load subclasses');
            return;
        }
        const subs = await res.json();
        setSubclasses(subs);
        setShown(classShown(picked, subs));
    };

    const changeSubclass = (e) => {
        const id = e.target.value;
        const picked = subclasses.find((s) => String(s.id) === id);
        setSubclassId(id);
        const extras = [
            picked.armor_proficiencies && `Armor: ${picked.armor_proficiencies}`,
            picked.weapon_proficiencies && `Weapons: ${picked.weapon_proficiencies}`,
            picked.tool_proficiencies && `Tools: ${picked.tool_proficiencies}`,
        ].filter(Boolean);
        setShown({
            img: picked.img_url ?? '',
            name: picked.name,
            hideTitle: true,
            sections: [
                { label: 'Description', body: picked.description ?? '-' },
                ...(extras.length ? [{ label: 'Bonus Proficiencies', body: extras.join('\n') }] : []),
            ],
            features: picked.features,
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step2', 'POST', { class_id: classId, subclass_id: subclassId });
            navigate('/create_char/step3');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <p>Loading...</p>;
    // 409 means step 1 wasn't done yet, so go back to it (the EJS page redirected too)
    if (error) return error.includes('409') ? <Navigate to="/create_char" replace /> : <p>Failure is upon us: {error}</p>;

    return (
        <>
            <header id="topContainer">
                <h1 id="siteTitle">Create Character</h1>
                <h2 id="formTitle">Step 2 of 3 — Class and Subclass</h2>
            </header>

            <main>
                <section id="formContainer">
                    <form className="formContainer" onSubmit={submit}>
                        <article id="classContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="class_id">Select Class</label>
                            <select className="bottomTile" id="class_id" value={classId} onChange={changeClass} required>
                                <option value="" disabled>Select your Class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </article>

                        <article id="subClassContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="subclass_id">Select Subclass</label>
                            <select
                                className="bottomTile"
                                id="subclass_id"
                                value={subclassId}
                                onChange={changeSubclass}
                                required
                                disabled={subclasses.length === 0}
                            >
                                <option value="" disabled>Select a Subclass</option>
                                {subclasses.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </article>
                        {saveError && <p>{saveError}</p>}
                        <article id="buttonContainer" className="formSectionContainer">
                            <button id="submit" type="submit">Next: Abilities</button>
                        </article>
                    </form>
                </section>
                <CreateDescription item={shown} />
            </main>
            <footer>
                <Link id="homeLink" to="/home">Cancel</Link>
            </footer>
        </>
    );
}

export default CreateStep2;
