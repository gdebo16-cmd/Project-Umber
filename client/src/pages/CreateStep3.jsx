import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import { STATS } from '../utils/stats';
import StepNav from './StepNav';
import Loader from '../components/Loader';

// Replaces views/create_char_step3.ejs (step 3: roll abilities, pick +2 and +1)
// The server does the rolling and remembers each roll; clicking a stat again rerolls it.
function CreateStep3() {
    usePageStyle(createCss, null, 'page-create');
    const navigate = useNavigate();
    const { data, setData, loading, error } = useFetch('/api/create_char/step3');
    const [plus2, setPlus2] = useState('');
    const [plus1, setPlus1] = useState('');
    const [saveError, setSaveError] = useState('');

    const roll = async (key) => {
        try {
            const result = await sendJson(`/api/create_char/roll/${key}`, 'POST');
            setData((prev) => ({ rolls: { ...prev.rolls, [key]: result.value } }));
        } catch (err) {
            setSaveError(err.message);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step3', 'POST', { plus2, plus1 });
            navigate('/home');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <Loader />;
    if (error) return error.includes('409') ? <Navigate to="/create_char" replace /> : <p>Failure is upon us: {error}</p>;

    const { rolls } = data;

    // same dropdown twice, so make it a small function
    const statSelect = (id, value, setValue, placeholder) => (
        <select className="bottomTile" id={id} value={value} onChange={(e) => setValue(e.target.value)} required>
            <option value="" disabled>{placeholder}</option>
            {STATS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
            ))}
        </select>
    );

    return (
        <>
            <header id="topContainer">
                <h1 id="site-title">Create Character</h1>
                <h2 id="form-title">Step 3 of 3 — Abilities</h2>
                <StepNav back="/create_char/step2" forward={null} />
            </header>
            <main>
                <section id="section3-title">
                    <h2>Roll for your Abilities</h2>
                </section>
                <section id="form-container-step3">
                    <form className="form-container" onSubmit={submit}>
                        <article id="plus2Container" className="form-section tile">
                            <label className="topTile" htmlFor="plus2">+2 bonus</label>
                            {statSelect('plus2', plus2, setPlus2, 'Select a +2 stat')}
                        </article>

                        <article id="plus1Container" className="form-section tile">
                            <label className="topTile" htmlFor="plus1">+1 bonus</label>
                            {statSelect('plus1', plus1, setPlus1, 'Select a +1 stat')}
                        </article>

                        <article id="base-stat-container" className="form-section">
                            {STATS.map((s) => (
                                <article key={s.key} id="baseStatItemContainer" className="form-section tile">
                                    <span className="topTile">{s.label}</span>
                                    <button
                                        id="roll-button"
                                        type="button"
                                        className="bottomTile btn-roll"
                                        onClick={() => roll(s.key)}
                                    >
                                        {rolls[s.key] ?? 'roll'}
                                    </button>
                                </article>
                            ))}
                        </article>

                        {saveError && <p>{saveError}</p>}

                        <article id="button-container" className="form-section">
                            <button id="submit" className="btn-form" type="submit">Create Character</button>
                            <Link id="mobile-cancel" to="/home">Cancel</Link>
                        </article>
                    </form>
                </section>
            </main>
            <footer>
                
            </footer>
        </>
    );
}

export default CreateStep3;
