import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import useSave from './useSave';
import CreateDescription from '../CreateDescription';

const GROUPS = ['Race', 'Class', 'Subclass', 'Mixed'];

function EditNameForm({ character, races, onSaved }) {
    const [name, setName] = useState(character.name);
    const [raceId, setRaceId] = useState(character.race_id);
    const [subraceId, setSubraceId] = useState(character.subrace_id ?? '');
    const race = races.find((r) => r.id === Number(raceId));
    const subraces = race?.subraces ?? [];
    const subrace = subraces.find((s) => s.id === Number(subraceId));
    const { save, message } = useSave(`/api/characters/${character.id}/edit/name`, onSaved);

    // premade headshots from /portraits/headshots.json: [{ file, label, group }]
    const [portraits, setPortraits] = useState([]);
    const [portrait, setPortrait] = useState(character.portrait_url ?? null);
    const portraitSave = useSave(`/api/characters/${character.id}/edit/portrait`, onSaved);

    useEffect(() => {
        fetch('/portraits/headshots.json')
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => setPortraits(Array.isArray(list) ? list : []))
            .catch(() => setPortraits([]));
    }, []);

    const submit = (e) => {
        e.preventDefault();
        save({ name, race_id: raceId, subrace_id: subraceId || null });
    };

    const pickPortrait = (url) => {
        setPortrait(url);
        portraitSave.save({ portrait_url: url });
    };

    const thumb = (url, label) => (
        <button
            type="button"
            key={url ?? 'default'}
            className={portrait === url ? 'portrait-thumb is-selected' : 'portrait-thumb'}
            onClick={() => pickPortrait(url)}
            title={label}
            aria-label={label}
            aria-pressed={portrait === url}
        >
            <img src={url ?? '/default-character.png'} alt={label} loading="lazy" />
        </button>
    );

    return (
        <form className="step-1-form" onSubmit={submit}>
            <article className="name-tile">
                <label className="name-label" htmlFor="name">Name</label>
                <input className="name-value" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </article>
            <article className="name-tile">
                <label className="name-label" htmlFor="race_id">Select Race</label>
                <select className="name-value" id="race_id" value={raceId} onChange={(e) => { setRaceId(Number(e.target.value)); setSubraceId(''); }} required>
                    {races.map((r) => (
                        <option className="name-option" key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </article>
            {subraces.length > 0 && (
                <article className="name-tile">
                    <label className="name-label" htmlFor="subrace_id">{race.name === 'Lupine' ? 'Breed' : 'Gem Line'}</label>
                    <select className="name-value" id="subrace_id" value={subraceId} onChange={(e) => setSubraceId(e.target.value === '' ? '' : Number(e.target.value))}>
                        <option className="name-option" value="">Select a sub-race</option>
                        {subraces.map((s) => (
                            <option className="name-option" key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </article>
            )}
            {subrace && (
                <CreateDescription item={{ img: subrace.img_url, name: `${race.name} (${subrace.name})`, text: subrace.description }} />
            )}
            <details className="form-section portrait-picker">
                <summary className="tile-top portrait-summary">Character Portrait</summary>
                <div className="tile-bottom">
                    <div className="portrait-grid">{thumb(null, 'Default')}</div>
                    {portraits.length === 0 ? (
                        <p className="portrait-empty">No portraits yet</p>
                    ) : (
                        GROUPS.map((g) => {
                            const items = portraits.filter((p) => p.group === g);
                            if (items.length === 0) return null;
                            return (
                                <details key={g} className="portrait-group" open>
                                    <summary className="portrait-group-title">{g}</summary>
                                    <div className="portrait-grid">
                                        {items.map((p) => thumb(`/portraits/${p.file}`, p.label))}
                                    </div>
                                </details>
                            );
                        })
                    )}
                    {portraitSave.message && <p>{portraitSave.message}</p>}
                </div>
            </details>
            {message && <p>{message}</p>}
            <article className="button-tile">
                <button className="action-button" type="submit">Save Changes</button>
                <Link className="action-button" to={`/characters/${character.id}`}>Cancel</Link>
            </article>
        </form>
    );
}

export default EditNameForm;