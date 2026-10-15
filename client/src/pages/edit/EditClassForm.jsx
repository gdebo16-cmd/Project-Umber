import { useState } from 'react';
import useSave from './useSave';
import CreateDescription from '../CreateDescription';
import LevelChoices from '../LevelChoices';
import { choiceFeatures, keepPicks } from '../../utils/levelChoices';
import { sendJson } from '../../utils/api';

// Class + subclass editor, laid out like creator Step 2: pick tiles on top, then the
// description box with the class and subclass features the character has unlocked
// (level <= the picked level, so it updates live while you change the level).
// Level lives here too (it used to be its own tab) and saves through /edit/level first,
// so the max_hp math and the "below level 3 clears the subclass" rule stay on the server.
// Feature choices (class and subclass) are picked in the per-level tiles and saved with
// the class save, so they stay usable while level/class/subclass changes are unsaved.
const SUBCLASS_LEVEL = 3; // matches models/characterModel.js
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

function EditClassForm({ character, classes, subClasses, onSaved }) {
    const [classId, setClassId] = useState(character.class_id);
    const [subclassId, setSubclassId] = useState(character.subclass_id ?? '');
    const [level, setLevel] = useState(character.level ?? 1);
    const [levelMsg, setLevelMsg] = useState('');
    const [picks, setPicks] = useState(character.feature_choices ?? {});
    const subLocked = level < SUBCLASS_LEVEL;
    const { save, message } = useSave(`/api/characters/${character.id}/edit/class`, (saved) => {
        setPicks(saved.feature_choices ?? {});
        onSaved(saved);
    });

    // only the subclasses that belong to the picked class (this replaces charEdit.js)
    const subsForClass = subClasses.filter((s) => Number(s.class_id) === Number(classId));
    const pickedClass = classes.find((c) => Number(c.id) === Number(classId));
    const pickedSub = subLocked ? undefined : subClasses.find((s) => Number(s.id) === Number(subclassId));

    const changeClass = (e) => {
        const newClassId = Number(e.target.value);
        setClassId(newClassId);
        // pick the first subclass of the new class so the two always match
        const first = subClasses.find((s) => Number(s.class_id) === newClassId);
        setSubclassId(first && !subLocked ? first.id : '');
    };

    const changeLevel = (e) => {
        const n = Number(e.target.value);
        setLevel(n);
        if (n < SUBCLASS_LEVEL) setSubclassId('');
        else if (!subclassId) {
            // just unlocked: start on the saved subclass if it fits, else the first one
            const keep = subsForClass.find((s) => Number(s.id) === Number(character.subclass_id));
            setSubclassId(keep ? keep.id : (subsForClass[0]?.id ?? ''));
        }
    };

    // class + subclass choice features unlocked at the picked level
    const choiceList = pickedClass ? choiceFeatures(pickedClass.features, pickedSub?.features, pickedSub?.name, level) : [];

    const submit = async (e) => {
        e.preventDefault();
        setLevelMsg('');
        // save the level first, so the class save is checked against the new level
        if (level !== (character.level ?? 1)) {
            try {
                const data = await sendJson(`/api/characters/${character.id}/edit/level`, 'POST', { level });
                onSaved(data.character);
            } catch (err) {
                setLevelMsg(err.message);
                return;
            }
        }
        save({
            class_id: classId,
            subclass_id: subLocked ? null : subclassId,
            feature_choices: keepPicks(picks, choiceList),
        });
    };

    const classSaved = Number(classId) === Number(character.class_id);
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

    return (
        <>
            <form className="form-container" onSubmit={submit}>
                <article className="form-section tile pick-tile">
                    <label className="tile-top" htmlFor="level">Level</label>
                    <select className="tile-bottom" id="level" value={level} onChange={changeLevel} required>
                        {LEVELS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </article>
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
                    <select
                        className="tile-bottom"
                        id="subclass_id"
                        value={subclassId}
                        onChange={(e) => setSubclassId(Number(e.target.value))}
                        required={!subLocked}
                        disabled={subLocked}
                    >
                        <option value="" disabled>{subLocked ? 'No Subclass yet' : 'Select a Subclass'}</option>
                        {subsForClass.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    {subLocked && <p className="pick-hint">Subclass unlocks at level {SUBCLASS_LEVEL}</p>}
                </article>
                <LevelChoices features={choiceList} picks={picks} onChange={setPicks} topClass="tile-top" bottomClass="tile-bottom" />
                {levelMsg && <p>{levelMsg}</p>}
                {message && <p>{message}</p>}
                {subLocked && (character.level ?? 1) >= SUBCLASS_LEVEL && character.subclass_id && (
                    <p>Saving below level {SUBCLASS_LEVEL} removes your subclass and its feature choices.</p>
                )}
                {!classSaved && <p>Changing class resets skill proficiencies when you save.</p>}
                <article className="form-section button-container">
                    <button className="btn-form" type="submit">Save Changes</button>
                </article>
            </form>
            <CreateDescription item={shown} />
        </>
    );
}

export default EditClassForm;