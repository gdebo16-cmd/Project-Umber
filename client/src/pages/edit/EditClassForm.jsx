import { useState } from 'react';
import useSave from './useSave';
import CreateDescription from '../CreateDescription';
import { sendJson } from '../../utils/api';

// Class + subclass editor, laid out like creator Step 2: pick tiles on top, then the
// description box with the class and subclass features the character has unlocked
// (level <= character.level, so it updates as soon as the Level tab saves).
function EditClassForm({ character, classes, subClasses, onSaved }) {
    const [classId, setClassId] = useState(character.class_id);
    const [subclassId, setSubclassId] = useState(character.subclass_id);
    const [choiceMsg, setChoiceMsg] = useState('');
    const { save, message } = useSave(`/api/characters/${character.id}/edit/class`, onSaved);

    // only the subclasses that belong to the picked class (this replaces charEdit.js)
    const subsForClass = subClasses.filter((s) => Number(s.class_id) === Number(classId));
    const pickedClass = classes.find((c) => Number(c.id) === Number(classId));
    const pickedSub = subClasses.find((s) => Number(s.id) === Number(subclassId));
    const level = character.level ?? 1;

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

    // picks only save against the class/subclass already saved on the character
    const classSaved = Number(classId) === Number(character.class_id);
    const subSaved = classSaved && Number(subclassId) === Number(character.subclass_id);
    const choices = character.feature_choices ?? {};

    const saveChoice = async (f, value) => {
        try {
            const data = await sendJson(`/api/characters/${character.id}/edit/features`, 'POST', {
                source: f.source,
                feature_id: f.id,
                choice: value,
            });
            onSaved(data.character);
            setChoiceMsg(`${f.name}: ${value} saved`);
        } catch (err) {
            setChoiceMsg(err.message);
        }
    };

    const unlocked = (list, source) =>
        (list ?? [])
            .filter((f) => f.level <= level)
            .map((f) => ({ ...f, source, key: `${source}:${f.id}`, name: source === 'subclass' ? `${f.name} (${pickedSub?.name})` : f.name }));

    const features = pickedClass
        ? [...unlocked(pickedClass.features, 'class'), ...unlocked(pickedSub?.features, 'subclass')]
            .sort((a, b) => a.level - b.level)
        : null;

    const shown = pickedClass && {
        img: pickedSub?.img_url || pickedClass.img_url,
        name: pickedClass.name,
        hideTitle: true,
        sections: [
            { label: 'Description', body: pickedClass.description ?? '-' },
            ...(pickedSub ? [{ label: `Subclass: ${pickedSub.name}`, body: pickedSub.description ?? '-' }] : []),
            { label: 'Stat Details', body: `Primary stat: ${pickedClass.primary_stat}\nHit die: ${pickedClass.hitpoint_die}` },
            { label: 'Armor & Weapons', body: `Armor: ${pickedClass.armor_proficiencies ?? '-'}\nWeapons: ${pickedClass.weapon_proficiencies ?? '-'}` },
            { label: 'Tools', body: pickedClass.tool_proficiencies ?? '-' },
        ],
        features,
    };

    // a dropdown under any unlocked feature that has options
    const renderFeature = (f) => {
        if (!f.options?.length) return null;
        const canSave = f.source === 'class' ? classSaved : subSaved;
        const current = choices[f.key]?.[0] ?? '';
        return (
            <label className="feature-choice">
                <span>Choice:</span>
                <select
                    value={current}
                    disabled={!canSave}
                    onChange={(e) => saveChoice(f, e.target.value)}
                >
                    <option value="" disabled>Pick one</option>
                    {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
                {!canSave && <span className="feature-choice-note">Save the class change first</span>}
            </label>
        );
    };

    return (
        <>
            <form className="form-container" onSubmit={submit}>
                <article className="form-section tile pick-tile">
                    <label className="tile-top" htmlFor="class_id">Select Class</label>
                    <select className="tile-bottom" id="class_id" value={classId} onChange={changeClass} required>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </article>
                <article className="form-section tile pick-tile">
                    <label className="tile-top" htmlFor="subclass_id">Select Subclass</label>
                    <select className="tile-bottom" id="subclass_id" value={subclassId} onChange={(e) => setSubclassId(Number(e.target.value))} required>
                        {subsForClass.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </article>
                {message && <p>{message}</p>}
                {!classSaved && <p>Changing class resets skill proficiencies and feature choices when you save.</p>}
                <article className="form-section button-container">
                    <button className="btn-form" type="submit">Save Changes</button>
                </article>
            </form>
            {choiceMsg && <p>{choiceMsg}</p>}
            <CreateDescription item={shown} renderFeature={renderFeature} />
        </>
    );
}

export default EditClassForm;