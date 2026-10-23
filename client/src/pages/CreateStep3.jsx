import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import { STATS } from '../utils/stats';
import StepNav from './StepNav';
import Loader from '../components/Loader';
import LevelChoices from './LevelChoices';
import CreateDescription from './CreateDescription';
import useBoostOptions from '../hooks/useBoostOptions';
import { choiceFeatures, keepPicks } from '../utils/levelChoices';

// Replaces views/create_char_step3.ejs (step 3: roll abilities, pick +2 and +1; step 4 saves)
// The server does the rolling and remembers each roll; clicking a stat again rerolls it.
function CreateStep3() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { data, setData, loading, error } = useFetch('/api/create_char/step3');
    const [plus2, setPlus2] = useState('');
    const [plus1, setPlus1] = useState('');
    const [saveError, setSaveError] = useState('');
    const [picks, setPicks] = useState(null); // Ability Boost / Primordial Ascent picks (feature_choices shape)
    if (data && picks === null) {
        setPicks(data.boostPicks ?? {});
        setPlus2(data.plus2 ?? ''); // coming back from step 4 keeps the +2/+1
        setPlus1(data.plus1 ?? '');
    }

    // boost rows show once every stat is rolled, filtered by the scores so far (rolls + the +2/+1)
    const boostList = data ? choiceFeatures(data.boostFeatures, [], null, data.level) : [];
    const rolled = !!data && STATS.every((s) => data.rolls[s.key] !== undefined);
    const scores = rolled ? Object.fromEntries(STATS.map((s) => [s.key, data.rolls[s.key] + (s.key === plus2 ? 2 : 0) + (s.key === plus1 ? 1 : 0)])) : null;
    const allowed = useBoostOptions({
        enabled: rolled && boostList.length > 0, classId: data?.class_id, subclassId: data?.subclass_id, level: data?.level,
        scores, boostKeys: boostList.map((f) => f.key), picks: picks ?? {}, setPicks,
    });

    const roll = async (key) => {
        try {
            const result = await sendJson(`/api/create_char/roll/${key}`, 'POST');
            setData((prev) => ({ ...prev, rolls: { ...prev.rolls, [key]: result.value } }));
        } catch (err) {
            setSaveError(err.message);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step3', 'POST', { plus2, plus1, feature_choices: keepPicks(picks ?? {}, boostList) });
            navigate('/create_char/step4'); // step 4 (Background) saves the character
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <Loader />;
    if (error) return error.includes('409') ? <Navigate to="/create_char" replace /> : <p>Failure is upon us: {error}</p>;

    const { rolls } = data;

    // same dropdown twice, so make it a small function
    const statSelect = (id, value, setValue, placeholder) => (
        <select className="name-value-2" id={id} value={value} onChange={(e) => setValue(e.target.value)} required>
            <option value="" disabled>{placeholder}</option>
            {STATS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
            ))}
        </select>
    );

    return (
        <>
            <header id='site-title'>
                <h1>Create Character</h1>
            </header>
                <div id='nav-container'>
                    <h2 id="form-title">Step 3 of 4 — Abilities</h2>
                    <StepNav back="/create_char/step2" forward={data?.plus2 ? '/create_char/step4' : null} />
                </div>
            <main>
            <div className="step-2-container-wrapper">
                <section id="form-container-step3" className="step-2-container">
                    <form className="step-2-form" onSubmit={submit}>
                        <article id="section3-title" className="name-tile-2">
                            <h2 className="name-label-2">Roll for your Abilities</h2>
                        </article>

                        <article id="plus2Container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="plus2">+2 bonus</label>
                            {statSelect('plus2', plus2, setPlus2, 'Select a +2 stat')}
                        </article>

                        <article id="plus1Container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="plus1">+1 bonus</label>
                            {statSelect('plus1', plus1, setPlus1, 'Select a +1 stat')}
                        </article>

                        <article id="base-stat-container" className="name-tile-2">
                            <label className="name-label-2">Ability Rolls</label>
                            {STATS.map((s) => (
                                <div key={s.key} id="baseStatItemContainer" className="name-value-container">
                                    <span className="name-value-top-half">{s.label}</span>
                                    <button
                                        id="roll-button"
                                        type="button"
                                        className="name-value-bottom-half"
                                        onClick={() => roll(s.key)}
                                    >
                                        {rolls[s.key] ?? 'roll'}
                                    </button>
                                </div>
                            ))}
                        </article>

                        {rolled && <LevelChoices features={boostList} picks={picks ?? {}} onChange={setPicks} allowed={allowed} tileClass="name-tile-2" rowClass="name-value-container" topClass="name-label-2" bottomClass="name-value-2" pickedClass="name-value-top-half" hintClass="name-value-bottom-half" hintTag="button" />}

                        {saveError && <p>{saveError}</p>}

                        <article id="button-container" className="button-tile">
                            <button id="submit" className="action-button" type="submit">Next: Background</button>
                            <Link id="mobile-cancel" to="/home" className="action-button">Cancel</Link>
                        </article>
                    </form>
                    <CreateDescription item={null} />
                </section>
            </div>
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default CreateStep3;
