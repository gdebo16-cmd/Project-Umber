import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import useFetch from '../hooks/useFetch';
import useContent from '../hooks/useContent';
import usePageStyle from '../hooks/usePageStyle';
import createCss from '../styles/char_create.css?inline';
import { sendJson } from '../utils/api';
import CreateDescription from './CreateDescription';
import StepNav from './StepNav';
import Loader from '../components/Loader';
import LevelChoices from './LevelChoices';
import { choiceFeatures, keepPicks, packChoiceFeatures, packBoostFeatures } from '../utils/levelChoices';
import WeaponFilter from '../components/WeaponFilter';
import ArmorFilter from '../components/ArmorFilter';
import { filterSortArmor, EMPTY_ARMOR_FILTER } from '../utils/armor';
import { filterSortWeapons, EMPTY_WEAPON_FILTER } from '../utils/weapons';
import { classGlyph, hideBrokenGlyph } from '../utils/glyphs';
import { statName } from '../utils/stats';

// Replaces views/create_char_step2.ejs (step 2: class and subclass)
// Role/calling display, create-time choices, and starting gear come from the content pack;
// Divine Blessing rows use pack scheme A keys (create step 3 / checkBoostRules).
const SUBCLASS_LEVEL = 3; // matches models/characterModel.js
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1); // 1 through 30, same as the editor

// Flatten content-pack schedule into CreateDescription's {level,name,description} rows
function flattenRoleFeatures(role) {
    const out = [];
    for (const lvl of role.levels || []) {
        for (const f of lvl.features || []) {
            out.push({ level: lvl.level, name: f.name, description: f.description || '' });
        }
    }
    return out;
}
function flattenCallingFeatures(calling) {
    return (calling.features || []).map((f) => ({
        level: f.level,
        name: f.name,
        description: f.description || '',
    }));
}
function startingGearFromPack(content, role, calling) {
    if (!content || !role) return { armor: [], weapons: [] };
    const armorProf = (calling?.armor_prof || role.armor_prof || '');
    const weaponProf = (calling?.weapon_prof || role.weapon_prof || '');
    const typeMap = { 'light armor': 'light', 'medium armor': 'medium', 'heavy armor': 'heavy', shields: 'shield', shield: 'shield' };
    const armorTypes = new Set();
    for (const part of String(armorProf).split(',')) {
        const t = typeMap[part.trim().toLowerCase()];
        if (t) armorTypes.add(t);
    }
    const catNames = new Set(String(weaponProf).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    const catById = new Map((content.weapon_category || []).map((c) => [Number(c.id), c]));
    const allowedCatIds = new Set((content.weapon_category || []).filter((c) => catNames.has(String(c.name).toLowerCase())).map((c) => Number(c.id)));
    const isCommon = (r) => String(r?.rarity ?? 'common').toLowerCase() === 'common';
    const armor = (content.armor || [])
        .filter((a) => armorTypes.has(String(a.armor_type).toLowerCase()) && isCommon(a))
        .map((a) => ({ id: a.id, name: a.name, armor_type: a.armor_type, rarity: a.rarity }))
        .sort((x, y) => x.name.localeCompare(y.name));
    const weapons = (content.weapons || [])
        .filter((w) => allowedCatIds.has(Number(w.category_id)) && isCommon(w) && !w.is_unique)
        .map((w) => ({
            id: w.id, name: w.name, weapon_category: catById.get(Number(w.category_id))?.name,
            damage_dice: w.damage_dice, damage_type: w.damage_type, rarity: w.rarity,
        }))
        .sort((x, y) => x.name.localeCompare(y.name));
    return { armor, weapons };
}

function classSections(c, subs) {
    return [
        { label: 'Description', body: c.description },
        { label: 'Spellcasting Ability', body: c.spellcasting_stat ? `${statName(c.spellcasting_stat)} - ${c.spellcasting}` : c.spellcasting },
        { label: 'Callings', body: subs.length ? subs.map((s) => s.name).join('\n') : 'Loading...' },
        { label: 'Stat Details', body: `Primary stat: ${statName(c.primary_stat)}\nHit die: ${c.hitpoint_die}` },
        { label: 'Armor & Weapons', body: `Armor: ${c.armor_proficiencies ?? '-'}\nWeapons: ${c.weapon_proficiencies ?? '-'}` },
        { label: 'Tools', body: c.tool_proficiencies ?? '-' },
    ];
}
function classShown(c, subs) {
    return { img: classGlyph(c.name), name: c.name, hideTitle: true, sections: classSections(c, subs), features: c.packFeatures };
}

function CreateStep2() {
    usePageStyle(createCss);
    const navigate = useNavigate();
    const { content, error: contentError } = useContent();
    // Still need the server list for feature choice ids the save endpoint checks
    const { data: serverClasses, loading: serverLoading, error: serverError } = useFetch('/api/create_char/step2');
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
    const { data: draft } = useFetch('/api/create_char/draft');
    const refilled = useRef(false); // refill from the draft only once
    const loadSeq = useRef(0); // ignore subclass fetches from an older class pick

    // Merge pack display fields with server feature rows (by role id)
    const classes = useMemo(() => {
        if (!content?.roles || !serverClasses) return null;
        return [...content.roles]
            .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || String(a.name).localeCompare(String(b.name)))
            .map((r) => {
                const srv = serverClasses.find((s) => Number(s.id) === Number(r.id));
                return {
                    id: r.id,
                    name: r.name,
                    primary_stat: r.primary_stat,
                    hitpoint_die: r.hit_die,
                    img_url: r.img_url,
                    description: r.description,
                    spellcasting: r.spellcasting,
                    spellcasting_stat: r.spell_stat,
                    armor_proficiencies: r.armor_prof,
                    weapon_proficiencies: r.weapon_prof,
                    tool_proficiencies: r.tool_prof,
                    skill_choice_count: r.skill_count ?? 0,
                    skill_options: r.skill_options ?? [],
                    skill_fixed: r.skill_fixed ?? [],
                    callings: r.callings ?? [],
                    packFeatures: flattenRoleFeatures(r),
                    rolePack: r,
                    // Pack Divine Blessing rows for step 3 / checkBoostRules
                    boostFeatures: packBoostFeatures(r),
                };
            });
    }, [content, serverClasses]);

    const picked = classes?.find((c) => String(c.id) === classId);

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

        // Callings: names/descriptions/choices from the pack
        const res = await fetch(`/api/create_char/subclasses/${id}`);
        if (!res.ok) {
            setSaveError('could not load callings');
            return;
        }
        const serverSubs = await res.json();
        if (seq !== loadSeq.current) return;
        const subs = (picked.callings ?? []).map((c) => {
            const srv = serverSubs.find((s) => Number(s.id) === Number(c.id));
            return {
                id: c.id,
                name: c.name,
                description: c.description,
                img_url: c.img_url,
                armor_proficiencies: c.armor_prof,
                weapon_proficiencies: c.weapon_prof,
                tool_proficiencies: c.tool_prof,
                packFeatures: flattenCallingFeatures(c),
                callingPack: c,
            };
        });
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
            features: picked.packFeatures,
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

    // starting gear from the content pack (server /api/create_char/gear validates the same list on submit)
    const gearSubId = subLocked ? '' : subclassId;
    const gearReady = !!classId && (subLocked || !!subclassId);
    useEffect(() => {
        if (!gearReady || !picked?.rolePack || !content) {
            if (!gearReady) setGear({ armor: [], weapons: [] });
            return;
        }
        const callingPack = (!subLocked && subclassId)
            ? (picked.callings || []).find((c) => String(c.id) === String(subclassId))
            : undefined;
        const g = startingGearFromPack(content, picked.rolePack, callingPack);
        setGear(g);
        setWeaponId((w) => (g.weapons.some((x) => String(x.id) === w) ? w : ''));
        setArmorId((a) => (g.armor.some((x) => String(x.id) === a) ? a : ''));
    }, [classId, gearSubId, level, gearReady, content, picked, subLocked, subclassId]);

    const shownGear = gearReady ? gear : { armor: [], weapons: [] };

    // Pack create-time choices + legacy boost rows (boosts picked on step 3)
    const pickedSub = subLocked ? undefined : subclasses.find((s) => String(s.id) === String(subclassId));
    const packChoices = picked?.rolePack
        ? packChoiceFeatures(picked.rolePack, pickedSub?.callingPack, level)
        : [];
    const boostChoices = picked
        ? choiceFeatures(picked.boostFeatures, [], null, level)
        : [];
    const allChoices = [...packChoices, ...boostChoices];
    const choiceList = packChoices; // shown here; boost keys still kept on submit via allChoices

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

    if (serverLoading || !content || !classes) return <Loader />;
    // 409 means step 1 wasn't done yet, so go back to it (the EJS page redirected too)
    if (serverError) return serverError.includes('409') ? <Navigate to="/create_char" replace /> : <p>Failure is upon us: {serverError}</p>;
    if (contentError) return <p>Failure is upon us: {contentError}</p>;

    return (
        <>
            <header id='site-title'>
                <h1>Create Character</h1>
            </header>
                <div id='nav-container'>
                    <h2 id="form-title">Step 2 of 4 - Role and Calling</h2>
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
                            <label className="name-label-2" htmlFor="class_id">{picked && <img className="tile-icon" src={classGlyph(picked.name)} alt="" aria-hidden="true" onError={hideBrokenGlyph} />}Select Role</label>
                            <select className="name-value-2" id="class_id" value={classId} onChange={changeClass} required>
                                <option value="" disabled className="name-option-2">Select your Role</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id} className="name-option-2">{c.name}</option>
                                ))}
                            </select>
                        </article>
                        {!subLocked && (
                        <article id="sub-class-container" className="name-tile-2">
                            <label className="name-label-2" htmlFor="subclass_id">Select Calling</label>
                            
                            <div className='name-value-container'>
                            <select
                                className="name-value-2"
                                id="subclass_id"
                                value={subclassId}
                                onChange={changeSubclass}
                                required={!subLocked}
                                disabled={subLocked || subclasses.length === 0}
                            >
                                <option value="" disabled className="name-option-2">{subLocked ? 'No Calling yet' : 'Select a Calling'}</option>
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