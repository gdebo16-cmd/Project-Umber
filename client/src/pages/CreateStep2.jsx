import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import CreateDescription from './CreateDescription';
import StepNav from './StepNav';
import Loader from '../components/Loader';

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
    const [skillPicks, setSkillPicks] = useState([]);
    const picked = classes?.find((c) => String(c.id) === classId);
    const { data: draft } = useFetch('/api/create_char/draft');

    const changeClass = (e) => loadClass(e.target.value);

    // shared by picking a class and by refilling a saved draft
    const loadClass = async (id, savedSubclassId) => {
        const picked = classes.find((c) => String(c.id) === id);
        setClassId(id);
        setSubclassId('');
        setSkillPicks(Array(picked.skill_choice_count ?? 0).fill(''));
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

        const savedSub = savedSubclassId && subs.find((s) => String(s.id) === String(savedSubclassId));
        if (savedSub) showSubclass(savedSub);
    };

    const changeSubclass = (e) => showSubclass(subclasses.find((s) => String(s.id) === e.target.value));

    const showSubclass = (picked) => {
        setSubclassId(String(picked.id));
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

    // coming back from step 3: refill class and subclass from the draft
    useEffect(() => {
        if (classes && draft?.class_id) loadClass(String(draft.class_id), draft.subclass_id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classes, draft]);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step2', 'POST', { class_id: classId, subclass_id: subclassId });
            navigate('/create_char/step3');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <Loader />;
    // 409 means step 1 wasn't done yet, so go back to it (the EJS page redirected too)
    if (error) return error.includes('409') ? <Navigate to="/create_char" replace /> : <p>Failure is upon us: {error}</p>;

    return (
        <>
            <header id="topContainer">
                <h1 id="site-title">Create Character</h1>
                <h2 id="form-title">Step 2 of 3 — Class and Subclass</h2>
                <StepNav back="/create_char" forward={draft?.subclass_id ? '/create_char/step3' : null} />
                
            </header>
            
            <main>
            
                <section id="form-container">
                    <form className="form-container" onSubmit={submit}>
                        <article id="class-container" className="form-section tile pick-tile">
                            <label className="topTile" htmlFor="class_id">Select Class</label>
                            <select className="bottomTile class-select" id="class_id" value={classId} onChange={changeClass} required>
                                <option value="" disabled className="class-option">Select your Class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id} className="class-option">{c.name}</option>
                                ))}
                            </select>
                        </article>

                        <article id="sub-class-container" className="form-section tile pick-tile">
                            <label className="topTile" htmlFor="subclass_id">Select Subclass</label>
                            <select
                                className="bottomTile subclass-select"
                                id="subclass_id"
                                value={subclassId}
                                onChange={changeSubclass}
                                required
                                disabled={subclasses.length === 0}
                            >
                                <option value="" disabled className="subclass-option">Select a Subclass</option>
                                {subclasses.map((s) => (
                                    <option key={s.id} value={s.id} className="subclass-option">{s.name}</option>
                                ))}
                            </select>
                        </article>
                        {picked && picked.skill_choice_count > 0 && (
                        <article id="skill-container" className="form-section tile pick-tile">
                            <label className="topTile">Choose {picked.skill_choice_count} Skills</label>
                            {picked.skill_fixed?.length > 0 && (
                                <p className="bottomTile skill-pick-select">Always proficient: {picked.skill_fixed.join(', ')}</p>
                            )}
                            {skillPicks.map((choice, i) => (
                                <select
                                    key={i}
                                    className="bottomTile skill-pick-select"
                                    value={choice}
                                    required
                                    onChange={(e) => {
                                        const next = [...skillPicks];
                                        next[i] = e.target.value;
                                        setSkillPicks(next);
                                    }}
                                >
                                    <option value="" disabled className="skill-pick-option">Pick a skill</option>
                                    {picked.skill_options
                                        .filter((s) => s === choice || !skillPicks.includes(s))
                                        .map((s) => (
                                            <option key={s} value={s} className="skill-pick-option">{s}</option>
                                        ))}
                                </select>
                            ))}
                        </article>
                        )}
                        {saveError && <p>{saveError}</p>}
                        <article id="button-container" className="form-section">
                            <button id="submit" type="submit">Next: Abilities</button>
                            <Link id="mobile-cancel" to="/home">Cancel</Link>
                        </article>
                    </form>
                </section>
                <CreateDescription item={shown} />
            </main>
            <footer>
                <Link id="home-link" to="/home">Cancel</Link>
            </footer>
        </>
    );
}

export default CreateStep2;
