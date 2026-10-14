import { useState } from 'react';
import useSave from './useSave';

// levels 1 through 30
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

function EditLevelForm({ character, onSaved }) {
    const [level, setLevel] = useState(character.level);
    const { save, message } = useSave(`/api/characters/${character.id}/edit/level`, onSaved);

    const submit = (e) => {
        e.preventDefault();
        save({ level });
    };

    return (
        <form className="form-container" onSubmit={submit}>
            <article className="form-section">
                <label className="tile-top" htmlFor="level">Level</label>
                <select className="tile-bottom" id="level" value={level ?? 1} onChange={(e) => setLevel(Number(e.target.value))} required>
                    {LEVELS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </article>
            {message && <p>{message}</p>}
            <article className="form-section button-container">
                <button className="btn-form" type="submit">Save Changes</button>
            </article>
        </form>
    );
}

export default EditLevelForm;
