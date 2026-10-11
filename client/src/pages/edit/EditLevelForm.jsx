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
        <form className="formContainer" onSubmit={submit}>
            <article className="formSectionContainer">
                <label className="cap-top" htmlFor="level">Level</label>
                <select className="cap-bottom" id="level" value={level ?? 1} onChange={(e) => setLevel(Number(e.target.value))} required>
                    {LEVELS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </article>
            {message && <p>{message}</p>}
            <article className="formSectionContainer buttonContainer">
                <button className="formButton" type="submit">Save Changes</button>
            </article>
        </form>
    );
}

export default EditLevelForm;
