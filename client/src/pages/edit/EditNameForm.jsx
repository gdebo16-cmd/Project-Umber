import { useEffect, useState } from 'react';
import useSave from './useSave';

const GROUPS = ['Race', 'Class', 'Subclass'];

function EditNameForm({ character, races, onSaved }) {
    const [name, setName] = useState(character.name);
    const [raceId, setRaceId] = useState(character.race_id);
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
        save({ name, race_id: raceId });
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
        <form className="form-container" onSubmit={submit}>
            <article className="form-section">
                <label className="tile-top" htmlFor="name">Name</label>
                <input className="tile-bottom" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </article>
            <article className="form-section">
                <label className="tile-top" htmlFor="race_id">Select Race</label>
                <select className="tile-bottom" id="race_id" value={raceId} onChange={(e) => setRaceId(Number(e.target.value))} required>
                    {races.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </article>
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
            <article className="form-section button-container">
                <button className="btn-form" type="submit">Save Changes</button>
            </article>
        </form>
    );
}

export default EditNameForm;