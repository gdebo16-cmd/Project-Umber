import { useState } from 'react';
import useSave from './useSave';

function EditClassForm({ character, classes, subClasses, onSaved }) {
    const [classId, setClassId] = useState(character.class_id);
    const [subclassId, setSubclassId] = useState(character.subclass_id);
    const { save, message } = useSave(`/api/characters/${character.id}/edit/class`, onSaved);

    // only the subclasses that belong to the picked class (this replaces charEdit.js)
    const subsForClass = subClasses.filter((s) => Number(s.class_id) === Number(classId));

    const changeClass = (e) => {
        const newClassId = Number(e.target.value);
        setClassId(newClassId);
        // pick the first subclass of the new class so the two always match
        const first = subClasses.find((s) => Number(s.class_id) === newClassId);
        setSubclassId(first ? first.id : '');
    };

    const submit = (e) => {
        e.preventDefault();
        save({ class_id: classId, subclass_id: subclassId });
    };

    return (
        <form className="formContainer" onSubmit={submit}>
            <article className="formSectionContainer">
                <label className="cap-top" htmlFor="class_id">Select Class</label>
                <select className="cap-bottom" id="class_id" value={classId} onChange={changeClass} required>
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </article>
            <article className="formSectionContainer">
                <label className="cap-top" htmlFor="subclass_id">Select Subclass</label>
                <select className="cap-bottom" id="subclass_id" value={subclassId} onChange={(e) => setSubclassId(Number(e.target.value))} required>
                    {subsForClass.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
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

export default EditClassForm;
