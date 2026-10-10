import { useState } from 'react';
import useSave from './useSave';

function EditNameForm({ character, races, onSaved }) {
    const [name, setName] = useState(character.name);
    const [raceId, setRaceId] = useState(character.race_id);
    const { save, message } = useSave(`/api/characters/${character.id}/edit/name`, onSaved);

    const submit = (e) => {
        e.preventDefault();
        save({ name, race_id: raceId });
    };

    return (
        <form className="formContainer" onSubmit={submit}>
            <article className="formSectionContainer">
                <label className="cap-top" htmlFor="name">Name</label>
                <input className="cap-bottom" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </article>
            <article className="formSectionContainer">
                <label className="cap-top" htmlFor="race_id">Select Race</label>
                <select className="cap-bottom" id="race_id" value={raceId} onChange={(e) => setRaceId(Number(e.target.value))} required>
                    {races.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
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

export default EditNameForm;
