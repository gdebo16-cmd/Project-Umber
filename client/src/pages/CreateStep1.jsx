import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import CreateDescription from './CreateDescription';

// Replaces views/create_char.ejs (step 1: name and race)
function CreateStep1() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { data: races, loading, error } = useFetch('/api/create_char/races');
    const [name, setName] = useState('');
    const [raceId, setRaceId] = useState('');
    const [saveError, setSaveError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step1', 'POST', { name, race_id: raceId });
            navigate('/create_char/step2');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    // the race that's picked right now, for the description box
    const race = races.find((r) => String(r.id) === String(raceId));

    return (
        <>
            <header id="topContainer">
                <h1 id="siteTitle">Create Character</h1>
                <h2 id="formTitle">Step 1 of 3 — Name and race</h2>
            </header>

            <main>
                <section id="formContainer">
                    <form className="formContainer" onSubmit={submit}>
                        <article id="charNameContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="name">Character name</label>
                            <input className="bottomTile" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="One with no name"  />
                        </article>
                        <article id="raceSelectContainer" className="formSectionContainer tile">
                            <label className="topTile" htmlFor="race_id">Race</label>
                            <select className="bottomTile" id="race_id" value={raceId} onChange={(e) => setRaceId(e.target.value)} required>
                                <option value="" disabled>Select your Race</option>
                                {races.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </article>
                        {saveError && <p>{saveError}</p>}
                        <article id="buttonContainer" className="formSectionContainer">
                            <button id="submit" type="submit">Next: Class</button>
                        </article>
                    </form>
                </section>
                <CreateDescription item={race && { img: race.img_url, name: race.name, text: race.traits, race }} />
            </main>
            <footer>
                <Link id="homeLink" to="/home">Home</Link>
            </footer>
        </>
    );
}

export default CreateStep1;
