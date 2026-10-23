import { useState } from 'react';
import { Link } from 'react-router';
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
        <form className="step-2-form" onSubmit={submit}>
            <article id="base-stat-container" className="name-tile-2">
                <label className="name-label-2">Ability Rolls</label>
                {STATS.map((s) => (
                    <div key={s.key} className="name-value-container">
                        <span className="name-value-top-half">{s.label}</span>
                        <button type="button" className="name-value-bottom-half" onClick={() => reroll(s.key)}>
                            {scores[s.key] ?? 'roll'}
                        </button>
                    </div>
                ))}
            </article>
            {message && <p>{message}</p>}
            <article className="button-tile">
                <button className="action-button" type="submit">Save Changes</button>
                <Link className="action-button" to={`/characters/${character.id}`}>Cancel</Link>
            </article>
        </form>
    );
}

export default EditAbilitiesForm;
