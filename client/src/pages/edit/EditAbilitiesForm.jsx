import { useState } from 'react';
import useSave from './useSave';
import { STATS } from '../../utils/stats';
import { roll4d6DropLowest } from '../../utils/math';

// Each stat button rerolls that stat (4d6, drop the lowest). Nothing saves until "Save Changes".
function EditAbilitiesForm({ character, onSaved }) {
    // start with the character's current scores: { str: 14, dex: 12, ... }
    const [scores, setScores] = useState(() =>
        Object.fromEntries(STATS.map((s) => [s.key, character[s.key]]))
    );
    const { save, message } = useSave(`/api/characters/${character.id}/edit/abilities`, onSaved);

    const reroll = (key) => setScores({ ...scores, [key]: roll4d6DropLowest() });

    const submit = (e) => {
        e.preventDefault();
        save(scores);
    };

    return (
        <form className="form-container" onSubmit={submit}>
            <article id="statsContainer" className="edit-stats">
                {STATS.map((s) => (
                    <article key={s.key} className="form-section">
                        <span className="tile-top">{s.label}</span>
                        <button type="button" className="tile-bottom btn-roll" onClick={() => reroll(s.key)}>
                            {scores[s.key] ?? 'roll'}
                        </button>
                    </article>
                ))}
            </article>
            {message && <p>{message}</p>}
            <article className="form-section button-container">
                <button className="btn-form" type="submit">Save Changes</button>
            </article>
        </form>
    );
}

export default EditAbilitiesForm;
