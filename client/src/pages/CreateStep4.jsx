import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import StepNav from './StepNav';
import Loader from '../components/Loader';
import CreateDescription from './CreateDescription';
import { alignmentGlyph, hideBrokenGlyph } from '../utils/glyphs';

// Step 4: Background / Personality (magic access v3)
// Alignment from the chart, then Upbringing, Lifestyle and Outlook (each gives 1 state; the 3 must differ),
// plus 1 race element (the 4th affinity). Destroy options only show with the Black gate. The server checks it all again.
const CATS = [
    { key: 'upbringing', label: 'Upbringing' },
    { key: 'lifestyle', label: 'Lifestyle' },
    { key: 'outlook', label: 'Outlook' },
];

function CreateStep4() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { data, loading, error } = useFetch('/api/create_char/step4');
    const [alignment, setAlignment] = useState('');
    const [ids, setIds] = useState({ upbringing: '', lifestyle: '', outlook: '' });
    const [anyStates, setAnyStates] = useState({ upbringing: '', lifestyle: '', outlook: '' }); // wildcard (Self-Taught Stray) picks
    const [elementId, setElementId] = useState('');
    const [shown, setShown] = useState(null);
    const [saveError, setSaveError] = useState('');

    if (loading) return <Loader />;
    if (error) return error.includes('409') ? <Navigate to="/create_char/step3" replace /> : <p>Failure is upon us: {error}</p>;

    const gate = data.subclassGate && data.blackGateAlignments.includes(alignment);
    const optionOf = (cat) => data[cat].find((o) => String(o.id) === ids[cat]);
    const stateOf = (cat) => {
        const o = optionOf(cat);
        if (!o) return '';
        return o.any_state ? anyStates[cat] : o.state;
    };
    // states already taken by the other two dropdowns
    const takenBy = (cat) => CATS.filter((c) => c.key !== cat).map((c) => stateOf(c.key)).filter(Boolean);

    const show = (o) => setShown(o ? {
        img: data.img_url, name: o.name,
        sections: [
            { label: 'Description', body: o.flavor },
            { label: 'State granted', body: o.any_state ? 'Any 1 state except destroy' : o.state },
            ...(o.perk ? [{ label: 'Perk granted', body: o.perk }] : []),
        ],
    } : null);

    const changeAlignment = (code) => {
        setAlignment(code);
        // losing the Black gate drops any destroy pick
        if (!(data.subclassGate && data.blackGateAlignments.includes(code))) {
            setIds((prev) => Object.fromEntries(CATS.map((c) => [c.key, data[c.key].find((o) => String(o.id) === prev[c.key])?.needs_black_gate ? '' : prev[c.key]])));
        }
        const a = data.alignments.find((x) => x.code === code);
        setShown(a ? { img: data.img_url, name: a.name, sections: [{ label: 'Colour', body: `${a.color} Magic` }] } : null);
    };

    const changePick = (cat, value) => {
        setIds((prev) => ({ ...prev, [cat]: value }));
        setAnyStates((prev) => ({ ...prev, [cat]: '' }));
        show(data[cat].find((o) => String(o.id) === value));
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            const body = { alignment_code: alignment, race_element_id: elementId };
            for (const c of CATS) {
                body[`${c.key}_id`] = ids[c.key];
                body[`${c.key}_state`] = anyStates[c.key] || null;
            }
            const saved = await sendJson('/api/create_char/step4', 'POST', body);
            if (saved.gearError) window.alert(saved.gearError);
            navigate('/home');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    return (
        <>
            <header id='site-title'>
                <h1>Create Character</h1>
            </header>
                <div id='nav-container'>
                    <h2 id="form-title">Step 4 of 4 - Background</h2>
                    <StepNav back="/create_char/step3" forward={null} />
                </div>
            <main>
            <div className="step-2-container-wrapper">
                <section className="step-2-container">
                    <form className="step-2-form" onSubmit={submit}>
                        <article id="alignment-container" className="name-tile-2">
                            <label className="name-label-2" id="alignment_label">Alignment</label>
                            <div className="alignment-grid" role="radiogroup" aria-labelledby="alignment_label">
                                {data.alignments.map((a) => (
                                    <button type="button" key={a.code} role="radio" aria-checked={alignment === a.code}
                                        className={alignment === a.code ? 'alignment-cell selected' : 'alignment-cell'}
                                        style={{ '--cell-color': a.color.toLowerCase() }}
                                        aria-label={a.name} title={a.name}
                                        onClick={() => changeAlignment(a.code)}>
                                        <img className="tile-icon" src={alignmentGlyph(a.color)} alt="" onError={hideBrokenGlyph} />
                                    </button>
                                ))}
                            </div>
                        </article>

                        {CATS.map((c) => {
                            const picked = optionOf(c.key);
                            const taken = takenBy(c.key);
                            return (
                                <article key={c.key} id={`${c.key}-container`} className="name-tile-2">
                                    <label className="name-label-2" htmlFor={`${c.key}_id`}>{c.label}</label>
                                    <select className="name-value-2" id={`${c.key}_id`} value={ids[c.key]} onChange={(e) => changePick(c.key, e.target.value)} required>
                                        <option value="" disabled className="name-option-2">Select your {c.label}</option>
                                        {data[c.key]
                                            .filter((o) => !o.needs_black_gate || gate)
                                            .filter((o) => String(o.id) === ids[c.key] || o.any_state || !taken.includes(o.state))
                                            .map((o) => (
                                                <option key={o.id} value={o.id} className="name-option-2">{o.name}</option>
                                            ))}
                                    </select>
                                    {picked?.any_state && (
                                        <select className="name-value-2" value={anyStates[c.key]} onChange={(e) => setAnyStates((prev) => ({ ...prev, [c.key]: e.target.value }))} required>
                                            <option value="" disabled className="name-option-2">Pick a state</option>
                                            {data.states.filter((s) => s !== 'destroy' && (s === anyStates[c.key] || !taken.includes(s))).map((s) => (
                                                <option key={s} value={s} className="name-option-2">{s}</option>
                                            ))}
                                        </select>
                                    )}
                                </article>
                            );
                        })}

                        <article id="race-element-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="race_element_id">Race Element</label>
                            <select className="name-value-2" id="race_element_id" value={elementId} onChange={(e) => setElementId(e.target.value)} required>
                                <option value="" disabled className="name-option-2">Select an Element</option>
                                {data.elements.map((el) => (
                                    <option key={el.id} value={el.id} className="name-option-2">{el.name}</option>
                                ))}
                            </select>
                        </article>

                        {saveError && <p>{saveError}</p>}

                        <article id="button-container" className="button-tile">
                            <button id="submit" className="action-button" type="submit">Create Character</button>
                            <Link id="mobile-cancel" to="/home" className="action-button">Cancel</Link>
                        </article>
                    </form>
                    <CreateDescription item={shown} />
                </section>
            </div>
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default CreateStep4;
