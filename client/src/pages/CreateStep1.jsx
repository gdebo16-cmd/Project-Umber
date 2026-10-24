import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import CreateDescription from './CreateDescription';
import StepNav from './StepNav';
import Loader from '../components/Loader';

// Replaces views/create_char.ejs (step 1: name and race)
function CreateStep1() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { data: races, loading, error } = useFetch('/api/create_char/races');
    const [name, setName] = useState('');
    const [raceId, setRaceId] = useState('');
    const [subraceId, setSubraceId] = useState('');
    const [saveError, setSaveError] = useState('');
    const [hasSavedRace, setHasSavedRace] = useState(false); // lets Forward work once step 1 was saved

    // coming back from a later step: refill name and race from the draft
    useEffect(() => {
        fetch('/api/create_char/draft')
            .then((res) => res.json())
            .then((draft) => {
                if (!draft) return;
                setName(draft.name === 'One with no name' ? '' : draft.name ?? '');
                if (draft.race_id) {
                    setRaceId(String(draft.race_id));
                    setSubraceId(draft.subrace_id ? String(draft.subrace_id) : '');
                    setHasSavedRace(true);
                }
            });
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step1', 'POST', { name, race_id: raceId, subrace_id: subraceId || null });
            navigate('/create_char/step2');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <Loader />;
    if (error) return <p>Failure is upon us: {error}</p>;

    // the race that's picked right now, for the description box
    const race = races.find((r) => String(r.id) === String(raceId));
    const subraces = race?.subraces ?? [];
    const subrace = subraces.find((s) => String(s.id) === String(subraceId));

    return (
        <>
            <header id='site-title'>
                    <h1>Create Character</h1>
            </header>
            <div id='nav-container'>
                        <h2>Step 1 of 4 — Name and race</h2>
                        <StepNav back={null} forward={hasSavedRace ? '/create_char/step2' : null} />
                </div>
            <main>
            <div className="step-1-container-wrapper">
                <section className="step-1-container">
                    <form className="step-1-form" onSubmit={submit}>
                        <article id="name" className="name-tile">
                            <label className="name-label" htmlFor="name">Character name</label>
                            <input className="name-value" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="One with no name"  />
                        </article>
                        <article id="race" className="name-tile">
                            <label className="name-label" htmlFor="race_id">Race</label>
                            <select className="name-value" id="race_id" value={raceId} onChange={(e) => { setRaceId(e.target.value); setSubraceId(''); }} required>
                                <option className="name-option" value="" disabled>Select your Race</option>
                                {races.map((r) => (
                                    <option className="name-option" key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </article>
                        {subraces.length > 0 && (
                            <article id="subrace" className="name-tile">
                                <label className="name-label" htmlFor="subrace_id">{race.name === 'Lupine' ? 'Breed' : 'Gem Line'}</label>
                                <select className="name-value" id="subrace_id" value={subraceId} onChange={(e) => setSubraceId(e.target.value)}>
                                    <option className="name-option" value="">Select a sub-race</option>
                                    {subraces.map((s) => (
                                        <option className="name-option" key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </article>
                        )}
                        {saveError && <p>{saveError}</p>}
                        <article id="button-container" className="button-tile">
                            <button className = 'action-button' id="action-button" type="submit">Next: Class</button>
                            <Link className = 'action-button' id="cancel-button" to="/home">Cancel</Link>
                        </article>
                    </form>
                    <CreateDescription item={race && (subrace
                    ? { img: subrace.img_url, name: `${race.name} (${subrace.name})`, text: subrace.description, race: { ...race, lineage_bonuses: [{ name: subrace.name, description: subrace.description }, ...(race.lineage_bonuses ?? [])] } }
                    : { img: race.img_url, name: race.name, text: race.traits, race })} />
                </section>
            </div>
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default CreateStep1;
