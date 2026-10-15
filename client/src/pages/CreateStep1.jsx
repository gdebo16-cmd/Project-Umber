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
            <header id="topContainer">
                <h1 id="site-title">Create Character</h1>
                <h2 id="form-title">Step 1 of 3 — Name and race</h2>
                <StepNav back={null} forward={hasSavedRace ? '/create_char/step2' : null} />
            </header>

            <main>
                <section id="form-container">
                    <form className="form-container" onSubmit={submit}>
                        <article id="char-name-container" className="form-section tile">
                            <label className="tile-top" htmlFor="name">Character name</label>
                            <input className="tile-bottom" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="One with no name"  />
                        </article>
                        <article id="race-select-container" className="form-section tile">
                            <label className="tile-top" htmlFor="race_id">Race</label>
                            <select className="tile-bottom" id="race_id" value={raceId} onChange={(e) => { setRaceId(e.target.value); setSubraceId(''); }} required>
                                <option value="" disabled>Select your Race</option>
                                {races.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </article>
                        {subraces.length > 0 && (
                            <article id="subrace-select-container" className="form-section tile">
                                <label className="tile-top" htmlFor="subrace_id">{race.name === 'Lupine' ? 'Breed' : 'Gem Line'}</label>
                                <select className="tile-bottom" id="subrace_id" value={subraceId} onChange={(e) => setSubraceId(e.target.value)}>
                                    <option value="">Select a sub-race</option>
                                    {subraces.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </article>
                        )}
                        {saveError && <p>{saveError}</p>}
                        <article id="button-container" className="form-section">
                            <button id="submit" type="submit">Next: Class</button>
                            <Link id="mobile-cancel" to="/home">Cancel</Link>
                        </article>
                    </form>
                </section>
                <CreateDescription item={race && (subrace
                    ? { img: subrace.img_url, name: `${race.name} (${subrace.name})`, text: subrace.description, race: { ...race, lineage_bonuses: [{ name: subrace.name, description: subrace.description }, ...(race.lineage_bonuses ?? [])] } }
                    : { img: race.img_url, name: race.name, text: race.traits, race })} />
            </main>
            <footer>
              <Link id="home-link" to="/home">Cancel</Link>
            </footer>
        </>
    );
}

export default CreateStep1;
