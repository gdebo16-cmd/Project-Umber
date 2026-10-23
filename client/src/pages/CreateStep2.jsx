import { useEffect, useRef, useState } from 'react';
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
import ArmorFilter from '../components/ArmorFilter';
import { filterSortArmor, EMPTY_ARMOR_FILTER } from '../utils/armor';
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
    const [armorFilter, setArmorFilter] = useState(EMPTY_ARMOR_FILTER);
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
    const refilled = useRef(false); // refill from the draft only once
    const loadSeq = useRef(0); // ignore subclass fetches from an older class pick

    const changeClass = (e) => loadClass(e.target.value);

    // shared by picking a class and by refilling a saved draft
    const loadClass = async (id, savedSubclassId, savedSkills, savedLevel, savedPicks) => {
        const seq = ++loadSeq.current;
        setSaveError('');
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
        if (seq !== loadSeq.current) return;
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
        if (!refilled.current && classes && draft?.class_id) {
            refilled.current = true;
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
        if (!gearReady) return;
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

    const shownGear = gearReady ? gear : { armor: [], weapons: [] };

    // class choices plus the picked subclass's choices, up to the picked level
    const pickedSub = subLocked ? undefined : subclasses.find((s) => String(s.id) === String(subclassId));
    // Ability Boost / Primordial Ascent rows are picked on step 3, after the scores are rolled
    const allChoices = picked ? choiceFeatures(picked.features, pickedSub?.features, pickedSub?.name, level) : [];
    const choiceList = allChoices.filter((f) => !isBoostRow(f)); // shown here; boost keys still kept on submit

    const submit = async (e) => {
        e.preventDefault();
        setSaveError('');
        try {
            await sendJson('/api/create_char/step2', 'POST', {
                class_id: classId,
                subclass_id: subLocked ? null : subclassId,
                level,
                skills: skillPicks,
                feature_choices: keepPicks(picks, allChoices),
                weapon_id: weaponId ? Number(weaponId) : null,
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
            <header id='site-title'>
                <h1>Create Character</h1>
            </header>
                <div id='nav-container'>
                    <h2 id="form-title">Step 2 of 4 — Class and Subclass</h2>
                    <StepNav back="/create_char" forward={draft?.class_id ? '/create_char/step3' : null} />
                </div>
            <main>
            <div className="step-2-container-wrapper">
                <section className="step-2-container">
                    <form className="step-2-form" onSubmit={submit}>
                        <article id="level-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="level">Select Level</label>
                            <select className="name-value-2" id="level" value={level} onChange={changeLevel} required>
                                {LEVELS.map((n) => (
                                    <option key={n} value={n} className="level-option">{n}</option>
                                ))}
                            </select>
                        </article>

                        <article id="class-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="class_id">Select Class</label>
                            <select className="name-value-2" id="class_id" value={classId} onChange={changeClass} required>
                                <option value="" disabled className="name-option-2">Select your Class</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id} className="name-option-2">{c.name}</option>
                                ))}
                            </select>
                        </article>
                        {!subLocked && (
                        <article id="sub-class-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="subclass_id">Select Subclass</label>
                            
                            <div className='name-value-container'>
                            <select
                                className="name-value-2"
                                id="subclass_id"
                                value={subclassId}
                                onChange={changeSubclass}
                                required={!subLocked}
                                disabled={subLocked || subclasses.length === 0}
                            >
                                <option value="" disabled className="name-option-2">{subLocked ? 'No Subclass yet' : 'Select a Subclass'}</option>
                                {subclasses.map((s) => (
                                    <option key={s.id} value={s.id} className="name-option-2">{s.name}</option>
                                ))}
                            </select>
                            </div>
                        </article>
                        )}
                        {gearReady && (
                        <article id="starting-weapon-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="weapon_id">Starting Weapon</label>
                            <WeaponFilter value={weaponFilter} onChange={setWeaponFilter} showRarity={false} />
                            <select className="name-value-bottom-half" id="weapon_id" value={weaponId} onChange={(e) => setWeaponId(e.target.value)} required>
                                <option value="" disabled className="name-option-2">Select a Weapon</option>
                                {filterSortWeapons(shownGear.weapons, weaponFilter).map((w) => (
                                    <option key={w.id} value={w.id} className="name-option-2">{w.name} ({w.weapon_category}, {w.damage_dice} {w.damage_type})</option>
                                ))}
                            </select>
                            {shownGear.weapons.length === 0 && <p>No starting weapons for this class</p>}
                        </article>
                        )}
                        {gearReady && shownGear.armor.length > 0 && (
                        <article id="starting-armor-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="armor_id">Starting Armor</label>
                            <ArmorFilter value={armorFilter} onChange={setArmorFilter} showRarity={false} />
                            <select className="name-value-bottom-half" id="armor_id" value={armorId} onChange={(e) => setArmorId(e.target.value)}>
                                <option value="" className="name-option-2">No armor</option>
                                {filterSortArmor(shownGear.armor, armorFilter).map((a) => (
                                    <option key={a.id} value={a.id} className="name-option-2">{a.name} ({a.armor_type})</option>
                                ))}
                            </select>
                        </article>
                        )}
                        {picked && picked.skill_choice_count > 0 && (
                        <article id="skill-container" className="name-tile-2">
                            <label className="name-label-2">Choose {picked.skill_choice_count} Skills</label>
                            {picked.skill_fixed?.length > 0 && (
                                <p className="name-value-2">Always proficient: {picked.skill_fixed.join(', ')}</p>
                            )}
                            {skillPicks.map((choice, i) => (
                                <select
                                    key={i}
                                    className="name-value-2"
                                    value={choice}
                                    required
                                    onChange={(e) => {
                                        const next = [...skillPicks];
                                        next[i] = e.target.value;
                                        setSkillPicks(next);
                                    }}
                                >
                                    <option value="" disabled className="name-option-2">Pick a skill</option>
                                    {picked.skill_options
                                        .filter((s) => s === choice || !skillPicks.includes(s))
                                        .map((s) => (
                                            <option key={s} value={s} className="name-option-2">{s}</option>
                                        ))}
                                </select>
                            ))}
                        </article>
                        )}
                        <LevelChoices features={choiceList} picks={picks} onChange={setPicks} tileClass="name-tile-2" rowClass="name-value-container" topClass="name-label-2" bottomClass="name-value-2" pickedClass="name-value-top-half" hintClass="name-value-bottom-half" hintTag="button" />
                        {saveError && <p>{saveError}</p>}
                        <article id="button-container" className="button-tile">
                            <button id="submit" type="submit" className="action-button">Next: Abilities</button>
                            <Link id="mobile-cancel" to="/home" className="action-button">Cancel</Link>
                        </article>
                    </form>
                    <CreateDescription item={shown} />
                </section>
            </div>
            </main>
            <footer>
                <p className="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default CreateStep2;
