import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import CreateDescription from './CreateDescription';
import StepNav from './StepNav';
import Loader from '../components/Loader';
import LevelChoices from './LevelChoices';
import { choiceFeatures, keepPicks, isBoostRow } from '../utils/levelChoices';
import WeaponFilter from '../components/WeaponFilter';
import { filterSortWeapons, EMPTY_WEAPON_FILTER } from '../utils/weapons';

// Replaces views/create_char_step2.ejs (step 2: class and subclass)
// Builds what the description box shows for a class: dropdown sections + feature tree
const SUBCLASS_LEVEL = 3; // matches models/characterModel.js
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1); // 1 through 30, same as the editor

function classSections(c, subs) {
    return [
        { label: 'Description', body: c.description },
        { label: 'Spellcasting Ability', body: c.spellcasting_stat ? `${c.spellcasting_stat} - ${c.spellcasting}` : c.spellcasting },
        { label: 'Subclasses', body: subs.length ? subs.map((s) => s.name).join('\n') : 'Loading...' },
        { label: 'Stat Details', body: `Primary stat: ${c.primary_stat}\nHit die: ${c.hitpoint_die}` },
        { label: 'Armor & Weapons', body: `Armor: ${c.armor_proficiencies ?? '-'}\nWeapons: ${c.weapon_proficiencies ?? '-'}` },
        { label: 'Tools', body: c.tool_proficiencies ?? '-' },
    ];
}
function classShown(c, subs) {
    return { img: c.img_url, name: c.name, hideTitle: true, sections: classSections(c, subs), features: c.features };
}

function CreateStep2() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { data: classes, loading, error } = useFetch('/api/create_char/step2');
    const [classId, setClassId] = useState('');
    const [weaponFilter, setWeaponFilter] = useState(EMPTY_WEAPON_FILTER);
    const [subclasses, setSubclasses] = useState([]);
    const [subclassId, setSubclassId] = useState('');
    const [level, setLevel] = useState(1);
    const subLocked = level < SUBCLASS_LEVEL;
    const [shown, setShown] = useState(null); // what the description box shows
    const [saveError, setSaveError] = useState('');
    const [skillPicks, setSkillPicks] = useState([]);
    const [picks, setPicks] = useState({}); // feature choices, same shape as characters.feature_choices
    const [gear, setGear] = useState({ armor: [], weapons: [] }); // starting gear this class can use
    const [weaponId, setWeaponId] = useState('');
    const [armorId, setArmorId] = useState('');
    const picked = classes?.find((c) => String(c.id) === classId);
    const { data: draft } = useFetch('/api/create_char/draft');

    const changeClass = (e) => loadClass(e.target.value);

    // shared by picking a class and by refilling a saved draft
    const loadClass = async (id, savedSubclassId, savedSkills, savedLevel, savedPicks) => {
        setPicks(savedPicks ?? {});
        if (savedLevel) setLevel(savedLevel);
        const picked = classes.find((c) => String(c.id) === id);
        setClassId(id);
        setSubclassId('');
        const blank = Array(picked.skill_choice_count ?? 0).fill('');
        // refill saved picks only if they still fit this class
        const fits = savedSkills?.length === blank.length && savedSkills.every((s) => picked.skill_options?.includes(s));
        setSkillPicks(fits ? [...savedSkills] : blank);
        setShown(classShown(picked, []));

        // load this class's subclasses (same as char_step2.js did)
        const res = await fetch(`/api/create_char/subclasses/${id}`);
        if (!res.ok) {
            setSaveError('could not load subclasses');
            return;
        }
        const subs = await res.json();
        setSubclasses(subs);
        setShown(classShown(picked, subs));

        const savedSub = savedSubclassId && subs.find((s) => String(s.id) === String(savedSubclassId));
        if (savedSub) showSubclass(savedSub);
    };

    // below SUBCLASS_LEVEL there is no subclass, so drop any pick
    const changeLevel = (e) => {
        const n = Number(e.target.value);
        setLevel(n);
        if (n < SUBCLASS_LEVEL) {
            setSubclassId('');
            if (picked) setShown(classShown(picked, subclasses));
        }
    };

    const changeSubclass = (e) => showSubclass(subclasses.find((s) => String(s.id) === e.target.value));

    const showSubclass = (picked) => {
        setSubclassId(String(picked.id));
        const extras = [
            picked.armor_proficiencies && `Armor: ${picked.armor_proficiencies}`,
            picked.weapon_proficiencies && `Weapons: ${picked.weapon_proficiencies}`,
            picked.tool_proficiencies && `Tools: ${picked.tool_proficiencies}`,
        ].filter(Boolean);
        setShown({
            img: picked.img_url ?? '',
            name: picked.name,
            hideTitle: true,
            sections: [
                { label: 'Description', body: picked.description ?? '-' },
                ...(extras.length ? [{ label: 'Bonus Proficiencies', body: extras.join('\n') }] : []),
            ],
            features: picked.features,
        });
    };

    // coming back from step 3: refill class and subclass from the draft
    useEffect(() => {
        if (classes && draft?.class_id) {
            loadClass(String(draft.class_id), draft.subclass_id, draft.skill_picks, draft.level, draft.feature_choices);
            setWeaponId(draft.weapon_id ? String(draft.weapon_id) : '');
            setArmorId(draft.armor_id ? String(draft.armor_id) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classes, draft]);

    // starting gear: load once the class (and subclass, when unlocked) is picked
    const gearSubId = subLocked ? '' : subclassId;
    const gearReady = !!classId && (subLocked || !!subclassId);
    useEffect(() => {
        if (!gearReady) {
            setGear({ armor: [], weapons: [] });
            return;
        }
        let stale = false;
        const qs = new URLSearchParams({ classId, level: String(level) });
        if (gearSubId) qs.set('subclassId', gearSubId);
        fetch('/api/create_char/gear?' + qs)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('could not load starting gear'))))
            .then((g) => {
                if (stale) return;
                setGear(g);
                // drop picks the new class / subclass can't use
                setWeaponId((w) => (g.weapons.some((x) => String(x.id) === w) ? w : ''));
                setArmorId((a) => (g.armor.some((x) => String(x.id) === a) ? a : ''));
            })
            .catch((err) => { if (!stale) setSaveError(err.message); });
        return () => { stale = true; };
    }, [classId, gearSubId, level, gearReady]);

    // class choices plus the picked subclass's choices, up to the picked level
    const pickedSub = subLocked ? undefined : subclasses.find((s) => String(s.id) === String(subclassId));
    // Ability Boost / Primordial Ascent rows are picked on step 3, after the scores are rolled
    const choiceList = picked ? choiceFeatures(picked.features, pickedSub?.features, pickedSub?.name, level).filter((f) => !isBoostRow(f)) : [];

    const submit = async (e) => {
        e.preventDefault();
        try {
            await sendJson('/api/create_char/step2', 'POST', {
                class_id: classId,
                subclass_id: subLocked ? null : subclassId,
                level,
                skills: skillPicks,
                feature_choices: keepPicks(picks, choiceList),
                weapon_id: weaponId,
                armor_id: armorId || null,
            });
            navigate('/create_char/step3');
        } catch (err) {
            setSaveError(err.message);
        }
    };

    if (loading) return <Loader />;
    // 409 means step 1 wasn't done yet, so go back to it (the EJS page redirected too)
    if (error) return error.includes('409') ? <Navigate to="/create_char" replace /> : <p>Failure is upon us: {error}</p>;

    return (
        <>
            <header id="topContainer">
                <h1 id="site-title">Create Character</h1>
                <h2 id="form-title">Step 2 of 3 — Class and Subclass</h2>
                <StepNav back="/create_char" forward={draft?.class_id ? '/create_char/step3' : null} />
                
            </header>
            
            <main>
            
                <section id="form-container">
                    <form className="form-container" onSubmit={submit}>
                        <article id="level-container" className="form-section tile pick-tile">
                            <label className="tile-top" htmlFor="level">Select Level</label>
                            <select className="tile-bottom level-select" id="level" value={level} onChange={changeLevel} required>
                                {LEVELS.map((n) => (
                                    <option key={n} value={n} className="level-option">{n}</option>
                                ))}
                            </select>
                        </article>

                        <article id="class-container" className="form-section tile pick-tile">
                            <label className="tile-top" htmlFor="class_id">Select Class</label>
                            <select className="tile-bottom class-select" id="class_id" value={classId} onChange={changeClass} required>
                                <option value="" disabled className="class-option">Select your Class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id} className="class-option">{c.name}</option>
                                ))}
                            </select>
                        </article>

                        <article id="sub-class-container" className="form-section tile pick-tile">
                            <label className="tile-top" htmlFor="subclass_id">Select Subclass</label>
                            <select
                                className="tile-bottom subclass-select"
                                id="subclass_id"
                                value={subclassId}
                                onChange={changeSubclass}
                                required={!subLocked}
                                disabled={subLocked || subclasses.length === 0}
                            >
                                <option value="" disabled className="subclass-option">{subLocked ? 'No Subclass yet' : 'Select a Subclass'}</option>
                                {subclasses.map((s) => (
                                    <option key={s.id} value={s.id} className="subclass-option">{s.name}</option>
                                ))}
                            </select>
                            {subLocked && <p className="pick-hint">Subclass unlocks at level {SUBCLASS_LEVEL}</p>}
                        </article>
                        {gearReady && (
                        <article id="starting-weapon-container" className="form-section tile pick-tile">
                            <label className="tile-top" htmlFor="weapon_id">Starting Weapon</label>
                            <WeaponFilter value={weaponFilter} onChange={setWeaponFilter} showRarity={false} />
                            <select className="tile-bottom weapon-select" id="weapon_id" value={weaponId} onChange={(e) => setWeaponId(e.target.value)} required>
                                <option value="" disabled className="weapon-option">Select a Weapon</option>
                                {filterSortWeapons(gear.weapons, weaponFilter).map((w) => (
                                    <option key={w.id} value={w.id} className="weapon-option">{w.name} ({w.weapon_category}, {w.damage_dice} {w.damage_type})</option>
                                ))}
                            </select>
                        </article>
                        )}
                        {gearReady && gear.armor.length > 0 && (
                        <article id="starting-armor-container" className="form-section tile pick-tile">
                            <label className="tile-top" htmlFor="armor_id">Starting Armor</label>
                            <select className="tile-bottom armor-select" id="armor_id" value={armorId} onChange={(e) => setArmorId(e.target.value)}>
                                <option value="" className="armor-option">No armor</option>
                                {gear.armor.map((a) => (
                                    <option key={a.id} value={a.id} className="armor-option">{a.name} ({a.armor_type})</option>
                                ))}
                            </select>
                        </article>
                        )}
                        {picked && picked.skill_choice_count > 0 && (
                        <article id="skill-container" className="form-section tile pick-tile">
                            <label className="tile-top">Choose {picked.skill_choice_count} Skills</label>
                            {picked.skill_fixed?.length > 0 && (
                                <p className="tile-bottom skill-pick-select">Always proficient: {picked.skill_fixed.join(', ')}</p>
                            )}
                            {skillPicks.map((choice, i) => (
                                <select
                                    key={i}
                                    className="tile-bottom skill-pick-select"
                                    value={choice}
                                    required
                                    onChange={(e) => {
                                        const next = [...skillPicks];
                                        next[i] = e.target.value;
                                        setSkillPicks(next);
                                    }}
                                >
                                    <option value="" disabled className="skill-pick-option">Pick a skill</option>
                                    {picked.skill_options
                                        .filter((s) => s === choice || !skillPicks.includes(s))
                                        .map((s) => (
                                            <option key={s} value={s} className="skill-pick-option">{s}</option>
                                        ))}
                                </select>
                            ))}
                        </article>
                        )}
                        <LevelChoices features={choiceList} picks={picks} onChange={setPicks} topClass="tile-top" bottomClass="tile-bottom" />
                        {saveError && <p>{saveError}</p>}
                        <article id="button-container" className="form-section">
                            <button id="submit" type="submit">Next: Abilities</button>
                            <Link id="mobile-cancel" to="/home">Cancel</Link>
                        </article>
                    </form>
                </section>
                <CreateDescription item={shown} />
            </main>
            <footer>
                <Link id="home-link" to="/home">Back to Home</Link>
            </footer>
        </>
    );
}

export default CreateStep2;
