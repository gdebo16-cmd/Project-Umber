import { useState } from 'react';
import { modOf, signed, healthInit, rollDice, rollToHit, proficiencyBonus } from '../../utils/math';
import { useCharacter } from '../CharacterContext';
import { getSpellSlots, beamsAt, beamRollText, beamDamageText, scaledAt } from '../../utils/spellSlots';
import { createPortal } from 'react-dom';
import { sendJson } from '../../utils/api';
import RuneControl from './RuneControl';
import { statName } from '../../utils/stats';
import { weaponRuneEffects, runicStrikeDice, utilityRuneEffects } from '../../utils/runes'; /*prep-done*/
import { stateGlyph, elementGlyph, alignmentGlyph, hideBrokenGlyph, bandClass } from '../../utils/glyphs';

// Dual wield: the off-hand attack is a bonus action and loses the ability modifier on DAMAGE (5e).
// Flip this to true to also drop the modifier from to-hit (proficiency always stays).
const DUAL_WIELD_DROPS_HIT_MOD = false;

// Your equipped weapons plus Fists. Each has a To Hit button and a Damage button.
function Actions() {
    const { character, hp, ownedArmor = [], ownedWeapons, setOwnedWeapons, onRoll, learnedSpells, spendSlot, usedSlots = {}, actionFeatures = [], embers = 0, embersMax = 0, spendEmbers, restUses = {}, countUse, cracks = 0, crackMax = 0, gainCracks, removeCracks, kindleSlot } = useCharacter();
    const actionSpells = learnedSpells ?? [];
    const spellScore = character[(character.spell_stat || '').toLowerCase()];
    // spells use the class's spellcasting_stat (casting_stat); weapons keep the primary stat
    const castScore = character[(character.casting_stat || character.spell_stat || '').toLowerCase()];
    const init = modOf(character.dex) + healthInit(hp, character.max_hp);
    const strMod = modOf(character.str);
    const spellMod = modOf(castScore);
    const spellToHit =  spellMod + proficiencyBonus(character.level);
    const spellSave = 8 + spellToHit;
    const toHit = init + strMod;
    // melee attacks use the class's primary stat (spell_stat is the class primary_stat)
    const primaryMod = modOf(spellScore);
    const meleeHit = init + primaryMod;
    // only prepared spells reach the Actions tab
    const actionSpellsList = actionSpells.filter((s) => s.is_action && s.is_prepared);
    // casting time decides the tile: bonus-action and reaction spells join those tiles, everything else stays under Magical Actions
    const magicSpells = actionSpellsList.filter((s) => s.action_type !== 'bonus' && s.action_type !== 'reaction');
    const bonusSpells = actionSpellsList.filter((s) => s.action_type === 'bonus');
    const reactionSpells = actionSpellsList.filter((s) => s.action_type === 'reaction');
    const [critKey, setCritKey] = useState(null);   // key of the action/spell whose last to-hit was a natural 20
    const critMark = (r) => (r.crit ? ' CRIT!' : r.fail ? ' (natural 1)' : '');
    const critClass = (key) => (critKey === key ? ' is-crit' : '');
   

    // Fists: Strength-based. The die shrinks as HP% drops (full 1d8, 75%+ 1d6, 50%+ 1d4, below 50% a flat 1), plus STR mod.
    // To-hit uses STR (toHit) instead of the class primary stat. Damage is floored at 0 by the roll.
    const fistDice = ['1', '1', '1d4', '1d6', '1d8'][healthInit(hp, character.max_hp)];

    const isReaver = character.class_name === 'Reaver';
    const isRuneWeaver = character.subclass_name === 'Rune Weaver' && character.level >= 3;
    const isWraith = character.class_name === 'Wraith';
    // rune damage riders on a weapon hit (crits double them too)
    const riderRolls = (a, crit) => (a.riders ?? []).map((r) => ({ ...r, n: rollDice(r.dice, crit) }));
    const riderText = (rs) => rs.map((r) => ` + ${r.n} ${r.type}`).join('');
    const riderSum = (rs) => rs.reduce((s, r) => s + r.n, 0);
    const weaponActions = ownedWeapons.filter((w) => w.is_equipped).map((w) => {
            const ranged = w.category === 'ranged';
            // Soul Brand (Reaver): the branded weapon uses CHA for attack and damage
            const branded = isReaver && !!w.soul_branded;
            // Rune Weaver: the runed weapon uses INT; Keen Rune +1 to hit; Ember/Rime/Spark/Gall riders
            const runed = isRuneWeaver && !!w.is_runed;
            // Sigil mark (Wraith): INT for attack and damage; counts as a sigil blade (Crack bonus, Sigil Strike)
            const marked = isWraith && !!w.sigil_marked;
            const sigil = marked || !!w.sigil_weapon;
            const runeFx = weaponRuneEffects(w);
            const statMod = branded ? modOf(character.cha) : (runed || marked) ? modOf(character.int) : null;
            const abilityMod = statMod ?? (ranged ? modOf(character.dex) : primaryMod);
            const oneHanded = !(w.properties ?? []).includes('two-handed');
            const dual = oneHanded && !!w.dual_wield;
            // Two hands: versatile weapons swap to their versatile die (never while dual wielding)
            const versatile = oneHanded && !!w.versatile_dice;
            const twoHand = versatile && !dual && !!w.two_handed;
            const hit = (statMod != null ? init + statMod : ranged ? init + modOf(character.dex) : meleeHit) + runeFx.hitBonus;
            // Seal Cracks: +1 radiant per Crack on sigil hits (the marked weapon, plus chain whips and flails via weapons.sigil_weapon)
            return { key: `w${w.id}`, weaponId: w.id, name: w.name, dice: twoHand ? w.versatile_dice : w.damage_dice, oneHanded, dual, versatile, twoHand,
                rarity: w.rarity, description: w.description, category: w.weapon_category,
                branded, runed, marked, runes: w.runes ?? [], riders: runeFx.riders,
                damageType: w.damage_type, attackBonus: w.attack_bonus || 0, stat: branded ? 'CHA' : (runed || marked) ? 'INT' : ranged ? 'DEX' : (character.spell_stat || 'STR').toUpperCase(),
                hands: twoHand ? 'Two hands' : oneHanded ? ((w.properties ?? []).includes('versatile') ? 'One or two hands' : 'One hand') : 'Two hands',
                range: w.range_normal ? `${w.range_normal}/${w.range_long ?? w.range_normal} ft` : ((w.properties ?? []).includes('reach') ? '10 ft (reach)' : '5 ft'),
                dmgMod: (dual ? 0 : abilityMod) + (sigil ? cracks : 0),
                hit: dual && DUAL_WIELD_DROPS_HIT_MOD ? hit - abilityMod : hit, sigil };
        });
    
    const actions = [
        ...weaponActions.filter((a) => !a.dual),
        { key: 'fists', name: 'Fists', dice: fistDice, dmgMod: strMod, hit: toHit },
    ];

    const bonusWeapons = weaponActions.filter((a) => a.dual);

    const toggleSigilMark = async (a) => {
        try {
            const data = await sendJson(`/api/characters/${character.id}/inventory/weapon/sigil-mark`, 'POST', { weapon_id: a.weaponId, marked: !a.marked });
            setOwnedWeapons(data.ownedWeapons);
        } catch (err) {
            onRoll(err.message);
        }
    };

    const toggleSoulBrand = async (a) => {
        try {
            const data = await sendJson(`/api/characters/${character.id}/inventory/weapon/soul-brand`, 'POST', { weapon_id: a.weaponId, soul_branded: !a.branded });
            setOwnedWeapons(data.ownedWeapons);
        } catch (err) {
            onRoll(err.message);
        }
    };

    const soulStrikeDice = character.level >= 23 ? '3d8' : character.level >= 11 ? '2d8' : '1d8';
    const rollSoulStrike = (a) => {
        const crit = critKey != null && critKey === a.key;
        setCritKey(null);
        const weapon = Math.max(0, rollDice(a.dice, crit) + a.dmgMod);
        const extra = rollDice(soulStrikeDice, crit);
        const rs = riderRolls(a, crit);
        onRoll(`Damage dealt: ${weapon}${riderText(rs)} + Soul Strike ${extra} force = ${weapon + riderSum(rs) + extra}${crit ? ' CRIT!' : ''} (spend 1 Temper)`);
    };

    // Runic Strike (Rune Weaver): once per turn, a runed-weapon hit adds force damage
    const runicDice = runicStrikeDice(character.level);
    // no turn tracker on the sheet: Runic Strike locks after use until you press New turn
    const [runicUsed, setRunicUsed] = useState(false);
    const rollRunicStrike = (a) => {
        if (runicUsed) return onRoll('Runic Strike is once per turn. Press New turn to reset it.');
        setRunicUsed(true);
        const crit = critKey != null && critKey === a.key;
        setCritKey(null);
        const weapon = Math.max(0, rollDice(a.dice, crit) + a.dmgMod);
        const extra = rollDice(runicDice, crit);
        const rs = riderRolls(a, crit);
        onRoll(`Damage dealt: ${weapon}${riderText(rs)} + Runic Strike ${extra} force = ${weapon + riderSum(rs) + extra}${crit ? ' CRIT!' : ''} (once per turn)`);
    };

    // Call the Brand (Reaver L2): bonus action, any distance on the same plane; a holder makes a STR save vs class DC
    const classDc = 8 + proficiencyBonus(character.level) + modOf(character.cha);
    const brandedWeapon = weaponActions.find((a) => a.branded);
    const hasCallTheBrand = isReaver && character.level >= 2 && !!brandedWeapon;
    const callTheBrand = () => onRoll(`Call the Brand: ${brandedWeapon.name} returns to your hand (bonus action). If someone holds it: Might roll DC ${classDc} (an attuned holder keeps it).`);

    const toggleDualWield = async (a) => {
        try {
            const data = await sendJson(`/api/characters/${character.id}/inventory/weapon/dual-wield`, 'POST', { weapon_id: a.weaponId, dual_wield: !a.dual });
            setOwnedWeapons(data.ownedWeapons);
        } catch (err) {
            onRoll(err.message);
        }
    };

    const toggleTwoHands = async (a) => {
        try {
            const data = await sendJson(`/api/characters/${character.id}/inventory/weapon/two-hands`, 'POST', { weapon_id: a.weaponId, two_handed: !a.twoHand });
            setOwnedWeapons(data.ownedWeapons);
        } catch (err) {
            onRoll(err.message);
        }
    };

    const [openItem, setOpenItem] = useState(null);
    const rollHit = (a) => {
        const r = rollToHit(a?.hit ?? toHit);
        setCritKey(r.crit ? a.key : null);
        onRoll(`Chance to hit: ${r.total}${critMark(r)}`);
    };

    // A natural 20 on this action's last to-hit doubles the damage dice (not the flat bonus), then the crit is used up
    const rollDamage = (a) => {
        const crit = critKey != null && critKey === a.key;
        setCritKey(null);
        if (a.beams > 1) return onRoll(beamDamageText(a.beams, a.dice, a.dmgMod, crit));
        const weapon = Math.max(0, rollDice(a.dice, crit) + a.dmgMod);
        const rs = riderRolls(a, crit);
        onRoll(`Damage dealt: ${weapon}${rs.length ? `${riderText(rs)} = ${weapon + riderSum(rs)}` : ''}${crit ? ' CRIT!' : ''}`);
    };

    // Single-beam spell to-hit: remembers a crit under the spell's key
    const spellHitText = (s) => {
        const r = rollToHit(spellToHit + (s.base_to_hit_modifier || 0));
        setCritKey(r.crit ? `s${s.id}` : null);
        return `Chance to hit: ${r.total}${critMark(r)}`;
    };

    // Spends one slot at the spell's level, then shows the message. Stops if none are left.
    const castSpell = (s, message) => {
        if (spendSlot && !spendSlot(s.base_level, s.id)) return onRoll(character.caster_type === 'body' ? `${s.name} is used until your next long rest.` : `No level ${s.base_level} slots left!`);
        onRoll(message);
    };

    // --- Upcasting ---
    const [pickerFor, setPickerFor] = useState(null);   // id of the spell whose level picker is open
    const [castLevels, setCastLevels] = useState({});   // last level each spell was cast at, by spell id

    // Slot levels from the spell's level up that still have a slot left
    const openSlotLevels = (s) => {
        const slots = getSpellSlots(character.level, character.spell_slots);
        const levels = [];
        for (let lvl = s.base_level; lvl <= slots.length; lvl++) {
            if ((usedSlots[lvl] || 0) < slots[lvl - 1]) levels.push(lvl);
        }
        return levels;
    };

    // Dice at a cast level: the spell_upcasts row for that level if there is one, else the base dice
    // Damage dice at a cast level: the spell_upcasts row for that level if there is one, else the base dice
    const diceAt = (s, lvl) => {
        const up = (s.upcasts || []).find((u) => u.cast_level === lvl);
        return up?.damage_dice || s.base_damage_dice;
    };

    // Healing at a cast level: spell_upcasts.heal_dice, else spells.heal_dice. heal_add_mod adds the casting mod. Healing never crits.
    const healAt = (s, lvl) => {
        const up = (s.upcasts || []).find((u) => u.cast_level === lvl);
        return up?.heal_dice || s.heal_dice;
    };
    const healMod = (s) => (s.heal_add_mod ? spellMod : 0);
    const healText = (s, lvl) => `Healed: ${Math.max(0, rollDice(healAt(s, lvl)) + healMod(s))}`;

    // Spells that can be upcast open the picker; cantrips and spells with no upcast rows (like Misty Step) cast right away
    const onCastClick = (s, castNow) => {
        if (s.base_level < 1 || !(s.upcasts && s.upcasts.length)) return castNow();
        if (openSlotLevels(s).length === 0) return onRoll(`No level ${s.base_level} slots left!`);
        setPickerFor(pickerFor === s.id ? null : s.id);
    };

    // Called when a level is picked: spend that slot, remember the level, show the result
    const castAtLevel = (s, lvl) => {
        setPickerFor(null);
        if (spendSlot && !spendSlot(lvl)) return onRoll(`No level ${lvl} slots left!`);
        setCastLevels({ ...castLevels, [s.id]: lvl });
        const start = `${character.name} casts ${s.name} at level ${lvl}!`;
        const dice = diceAt(s, lvl);
        if (s.attack_type) return onRoll(beamsAt(s, character.level) > 1
            ? `${start} ${beamRollText(beamsAt(s, character.level), spellToHit + (s.base_to_hit_modifier || 0), dice, s.dmgMod || 0)}`
            : `${start} ${spellHitText(s)}`);
        if (s.opponent_save_roll) return onRoll(`${start} Target must make a ${statName(s.opponent_save_roll)} roll and roll higher than a ${spellSave}`);
        if (!dice && healAt(s, lvl)) return onRoll(`${start} ${healText(s, lvl)}`);
        if (dice) return onRoll(`${start} Damage dealt: ${Math.max(0, rollDice(dice) + (s.dmgMod || 0))}`);
        onRoll(start);
    };

    const ACTION_LABELS = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };

    // --- Features: embers costs, scaling dice and once-per-rest locks all come from the feature row ---
    const featureKey = (f) => `${f.source}-${f.id}`;
    const costOf = (f) => (f.ember_cost == null ? 0 : scaledAt(f.cost_scaling, 'cost', character.level, f.ember_cost));
    const diceOf = (f) => scaledAt(f.dice_scaling, 'dice', character.level, f.dice);
    const usesOf = (f) => scaledAt(f.uses_scaling, 'uses', character.level, f.rest_uses);
    const usedOf = (f) => restUses[featureKey(f)] || 0;
    const isLocked = (f) => f.rest_uses != null && usedOf(f) >= usesOf(f);
    const weaponHitFeature = actionFeatures.find((f) => f.on_weapon_hit);   // e.g. Sigil Strike
    const listedFeatures = actionFeatures.filter((f) => !f.on_weapon_hit);

    // Weapon damage + an on-hit feature (Sigil Strike): spend its embers, add its dice to this damage roll
    const rollWithHitFeature = (a, f) => {
        const cost = costOf(f);
        if (cost && !(spendEmbers && spendEmbers(cost))) return onRoll(`Not enough embers for ${f.name}: need ${cost}, have ${embers}.`);
        // crit doubles the weapon dice and the Sigil dice; dmgMod (stat + Cracks) stays flat
        const crit = critKey != null && critKey === a.key;
        setCritKey(null);
        const weapon = Math.max(0, rollDice(a.dice, crit) + a.dmgMod);
        const extra = rollDice(diceOf(f), crit);
        const rs = riderRolls(a, crit);
        onRoll(`Damage dealt: ${weapon}${riderText(rs)} + ${f.name} ${extra} radiant = ${weapon + riderSum(rs) + extra}${crit ? ' CRIT!' : ''}${cost ? ` (-${cost} embers, ${embers - cost}/${embersMax} left)` : ''}`);
    };

    // count = dice bought for per-die features (Bound Virtue). Spends embers first; blocked if the pool is too low.
    const activateFeature = (f, count = 1) => {
        if (isLocked(f)) return onRoll(`${f.name}: no uses left (${usedOf(f)}/${usesOf(f)}) until your next ${f.rest_lock} rest.`);
        const cost = costOf(f) * (f.embers_per_die ? count : 1);
        if (cost && !(spendEmbers && spendEmbers(cost))) return onRoll(`Not enough embers for ${f.name}: need ${cost}, have ${embers}.`);
        if (f.rest_uses != null && countUse) countUse(featureKey(f));
        const dice = diceOf(f);
        const rollWith = dice && (f.embers_per_die ? `${count}${dice.slice(dice.indexOf('d'))}` : dice);
        const crackText = crackMax && f.cracks_removed ? ` -${Math.min(cracks, f.cracks_removed)} Crack` : crackMax && f.cracks_gained ? ` +${f.cracks_gained} Crack` : '';
        const usesText = f.rest_uses != null ? ` [${usesOf(f) - usedOf(f) - 1}/${usesOf(f)} uses left]` : '';
        onRoll(`${character.name} uses ${f.name}${cost ? ` (-${cost} embers, ${embers - cost}/${embersMax} left)` : ''}${crackText}${usesText}!${rollWith ? ` Rolled ${rollWith}: ${rollDice(rollWith)}` : ''}`);
        if (crackMax && f.cracks_removed && removeCracks) removeCracks(f.cracks_removed);
        if (crackMax && f.cracks_gained && gainCracks) gainCracks(f.cracks_gained);
    };

    // The buttons for one feature row (same in every feature group)
    const featureButtons = (f) => (
        <div className="action-button-container">
            {f.kindles_slot && kindleSlot ? (
                <select className="upcast-picker" value="" disabled={!!isLocked(f)}
                    onChange={(e) => kindleSlot(Number(e.target.value), featureKey(f))}>
                    <option value="" disabled>{isLocked(f) ? `Used (${f.rest_lock} rest)` : `Embers ${embers}/${embersMax}: spend slot...`}</option>
                    {getSpellSlots(character.level, character.spell_slots).map((n, j) => (usedSlots[j + 1] || 0) < n && (
                        <option key={j + 1} value={j + 1}>Level {j + 1} slot (+{j + 1} embers)</option>
                    ))}
                </select>
            ) : f.embers_per_die ? (
                <select className="upcast-picker" value="" onChange={(e) => activateFeature(f, Number(e.target.value))}>
                    <option value="" disabled>{`Embers ${embers}/${embersMax}: dice...`}</option>
                    {Array.from({ length: proficiencyBonus(character.level) }, (_, i) => (
                        <option key={i + 1} value={i + 1} disabled={(i + 1) * costOf(f) > embers}>{(i + 1) * costOf(f)} embers ({i + 1}{(diceOf(f) || 'd8').slice((diceOf(f) || 'd8').indexOf('d'))})</option>
                    ))}
                </select>
            ) : (
                <>
                    {f.dice && !costOf(f) && (
                        <button type="button" className="action-button damage-button hover-grow"
                            onClick={() => onRoll(`${character.name} uses ${f.name}! Rolled: ${rollDice(diceOf(f))}`)}>
                            {diceOf(f)}
                        </button>
                    )}
                    <button type="button" className="action-button damage-button hover-grow" disabled={!!isLocked(f)}
                        onClick={() => activateFeature(f)}>
                        {costOf(f) ? `${diceOf(f) ? `${diceOf(f)} ` : ''}(${costOf(f)} R)` : 'Use'}
                    </button>
                </>
            )}
        </div>
    );
    const bonusFeatures = actionFeatures.filter((f) => f.action_type === 'bonus');

    // Utility runes on worn/equipped items (rune-weaver-inscribe-runes.md). Lantern = bonus action, Mending = 1/long rest reaction.
    const runeFx = utilityRuneEffects(ownedArmor, ownedWeapons);
    const [litLanterns, setLitLanterns] = useState({});
    const toggleLantern = (l) => {
        const on = !litLanterns[l.key];
        setLitLanterns({ ...litLanterns, [l.key]: on });
        onRoll(on ? `Lantern Rune (${l.item}): bright light 20 ft and dim light 20 ft more (bonus action).` : `Lantern Rune (${l.item}): light off (bonus action).`);
    };
    const intMod = modOf(character.int);
    const rollMending = (m) => {
        if (restUses[m.key]) return onRoll('Mending Rune: used until your next long rest.');
        if (countUse) countUse(m.key);
        onRoll(`Mending Rune (${m.item}): reduce the hit's damage by ${Math.max(0, rollDice('1d6') + intMod)} (reaction, 1/long rest).`);
    };
    const itemNames = (list) => [...new Set(list.map((x) => x.item))].join(', ');
    const runeNotes = [
        runeFx.fleet && 'Fleet Rune: +5 ft walking speed (in your Speed distance).',
        runeFx.dusksight && (character.race_darkvision ? 'Dusksight Rune: your darkvision extends 30 ft.' : 'Dusksight Rune: darkvision 30 ft.'),
        runeFx.hush.length > 0 && `Hush Rune (${itemNames(runeFx.hush)}): makes no noise${runeFx.hush.some((h) => h.armor?.stealth_disadvantage) ? '; no Shadowth disadvantage from this armor' : ''}.`,
        runeFx.anchor.length > 0 && `Anchor Rune (${itemNames(runeFx.anchor)}): can't be disarmed or taken from you while you're conscious.`,
        runeFx.homing.length > 0 && `Homing Rune (${itemNames(runeFx.homing)}): a thrown weapon returns to your hand; fired ammunition is recovered after combat.`,
        runeFx.mending.length > 0 && `Mending Rune (${itemNames(runeFx.mending)}): repairs itself in 1 minute.`,
    ].filter(Boolean);
    const reactionFeatures = actionFeatures.filter((f) => f.action_type === 'reaction');

    // One learned spell with its to-hit/save, damage (crit-aware), heal and upcast buttons. Shared by the Magical Actions, Bonus Actions and Reactions tiles.
    const spellRow = (s) => (
        <li key={s.id} className="action-item spell">
            <button type="button" className="btn caption-btn btn-spell-name hover-grow" onClick={() => setOpenItem({ kind: 'spell', data: s })}>
                {s.name}
            </button>

            <div className="action-button-container">
                {s.attack_type ? (
                    <button type='button' className='action-button hover-grow'
                    onClick={() => onCastClick(s, () => castSpell(s, beamsAt(s, character.level) > 1
                        ? `${character.name} casts ${s.name}! ${beamRollText(beamsAt(s, character.level), spellToHit + (s.base_to_hit_modifier || 0), s.base_damage_dice, s.dmgMod || 0)}`
                        : `${character.name} casts ${s.name}! ${spellHitText(s)}`))}>
                        {signed(spellToHit + (s.base_to_hit_modifier || 0))}
                    </button>
                ) : s.opponent_save_roll ? (
                    <button type='button' className='btn action-button hover-grow' onClick={() => onCastClick(s, () => castSpell(s, `Target must make a ${statName(s.opponent_save_roll)} roll and roll higher than a ${spellSave}`))}>{statName(s.opponent_save_roll)} {spellSave}</button>
                ) : null}

                {(s.base_damage_dice) ? (
                    // with a to-hit/save button the damage is just a roll; without one, this button is the cast
                    <button type="button" className={`btn action-button  hover-grow${critClass(`s${s.id}`)}`} onClick={() => (s.attack_type || s.opponent_save_roll) ? rollDamage({ key: `s${s.id}`, dice: diceAt(s, castLevels[s.id] ?? s.base_level), dmgMod: s.dmgMod || 0, beams: beamsAt(s, character.level) }) : onCastClick(s, () => castSpell(s, `${character.name} casts ${s.name}! Damage dealt: ${Math.max(0, rollDice(s.base_damage_dice) + (s.dmgMod || 0))}`))}>{diceAt(s, castLevels[s.id] ?? s.base_level)}{s.dmgMod ? signed(s.dmgMod) : ''}</button>
                ) : s.heal_dice ? (
                    // healing spells: dice (+ casting mod where the rules add it), never crits
                    <button type="button" className="btn action-button hover-grow" onClick={() => onCastClick(s, () => castSpell(s, `${character.name} casts ${s.name}! ${healText(s, s.base_level)}`))}>{healAt(s, castLevels[s.id] ?? s.base_level)}{healMod(s) ? signed(healMod(s)) : ''}</button>
                ) : (
                    <button type='button' className='btn action-button  hover-grow' onClick={() => onCastClick(s, () => castSpell(s, `${character.name} casts ${s.name}!`))}>Cast</button>
                )}

                {/* Level picker: shows after clicking a leveled spell's cast button */}
                {pickerFor === s.id && (
                    <select className="upcast-picker" autoFocus defaultValue=""
                        onChange={(e) => castAtLevel(s, Number(e.target.value))}
                        onBlur={() => setPickerFor(null)}>
                        <option value="" disabled>Cast at level...</option>
                        {openSlotLevels(s).map((lvl) => (
                            <option key={lvl} value={lvl}>Level {lvl}{(diceAt(s, lvl) || healAt(s, lvl)) ? ` (${diceAt(s, lvl) || healAt(s, lvl)})` : ''}</option>
                        ))}
                    </select>
                )}
            </div>
        </li>
    );


    // one weapon row (Physical Actions, or Bonus Actions when dual wielded)
    const weaponRow = (a) => (
                        <li key={a.key} className="action-item spell">
                            <button type="button" className="caption-btn hover-grow" onClick={() => setOpenItem({ kind: 'weapon', data: a })}>
                                    {a.name}
                                </button>
                            <div className="action-button-container">
                                <button type="button" className="btn action-button btn-to-hit hover-grow" onClick={() => rollHit(a)}>{signed(a.hit ?? toHit)}</button>
                                <button type="button" className={`btn action-button damage-button hover-grow${critClass(a.key)}`} onClick={() => rollDamage(a)}>{a.dice}{a.dmgMod ? signed(a.dmgMod) : ''}</button>
                                {a.runed && (
                                    <>
                                        <button type="button" className={`btn action-button damage-button hover-grow${critClass(a.key)}`} title={`Runic Strike: once per turn, add ${runicDice} force`}
                                            disabled={runicUsed} onClick={() => rollRunicStrike(a)}>
                                            {runicUsed ? 'Runic used' : `+${runicDice} (Runic)`}
                                        </button>
                                        {runicUsed && <button type="button" className="btn action-button hover-grow" onClick={() => setRunicUsed(false)}>New turn</button>}
                                    </>
                                )}
                                {a.branded && (
                                    <button type="button" className={`btn action-button damage-button hover-grow${critClass(a.key)}`} title={`Soul Strike: on a hit, add ${soulStrikeDice} force (1 Temper)`}
                                        onClick={() => rollSoulStrike(a)}>
                                        +{soulStrikeDice} (1 T)
                                    </button>
                                )}
                                {a.sigil && weaponHitFeature && (
                                    <button type="button" className={`btn action-button damage-button hover-grow${critClass(a.key)}`} title={`${weaponHitFeature.name}: on a hit, add ${diceOf(weaponHitFeature)} radiant`}
                                        onClick={() => rollWithHitFeature(a, weaponHitFeature)}>
                                        +{diceOf(weaponHitFeature)} ({costOf(weaponHitFeature)} embers)
                                    </button>
                                )}
                            </div>
                        </li>
    );

    // the open weapon popup reads the live row, so the dual wield checkbox updates in place
    const openWeapon = openItem?.kind === 'weapon' ? (weaponActions.find((x) => x.key === openItem.data.key) ?? openItem.data) : null;

    return (
        <ul className="action-container">
            <li className="action-list">
                <span className="action-title" id="physical-actions-title">Physical Actions</span>
                <ul className="action-set" id="physical-actions-set">
                    {actions.map(weaponRow)}
                </ul>
            </li>

            <li className="action-list">
                <span className="action-title" id="magical-actions-title">Magical Actions</span>
                <ul className="action-set" id="magical-actions-set">
                    {magicSpells.length === 0 ? (
                        <li className="action-item">No spells set as actions yet.</li>
                    ) : (
                        magicSpells.map(spellRow)
                    )}
                </ul>
            </li>

            <li className="action-list">
                <span className="action-title" id="physical-actions-title">Bonus Actions</span>
                <ul className="action-set" id="physical-actions-set">
                    {bonusWeapons.map(weaponRow)}
                    {hasCallTheBrand && (
                        <li className="action-item">
                            <span className="caption-btn">Call the Brand ({brandedWeapon.name})</span>
                            <div className="action-button-container">
                                <button type="button" className="action-button" onClick={callTheBrand}>Call</button>
                            </div>
                        </li>
                    )}
                    {runeFx.lanterns.map((l) => (
                        <li key={l.key} className="action-item">
                            <span className="caption-btn">Lantern Rune ({l.item})</span>
                            <div className="action-button-container">
                                <button type="button" className="action-button" onClick={() => toggleLantern(l)}>{litLanterns[l.key] ? 'Light off' : 'Light on'}</button>
                            </div>
                        </li>
                    ))}
                    {bonusSpells.map(spellRow)}
                    {bonusFeatures.map((f) => (
                            <li key={`${f.source}-${f.id}`} className="action-item">
                                <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'feature', data: f })}>
                                    {f.name}
                                </button>
                                {featureButtons(f)}
                            </li>
                        ))}
                </ul>
            </li>

            <li className="action-list">
                <span className="action-title" id="reactions-title">Reactions</span>
                <ul className="action-set" id="reactions-set">
                    {runeFx.mending.map((m) => (
                        <li key={m.key} className="action-item">
                            <span className=" caption-btn">Mending Rune ({m.item})</span>
                            <div className="action-button-container">
                                <button type="button" className="action-button damage-button" disabled={!!restUses[m.key]} onClick={() => rollMending(m)}>
                                    {restUses[m.key] ? 'Used (long rest)' : `1d6${intMod ? signed(intMod) : ''}`}
                                </button>
                            </div>
                        </li>
                    ))}
                    {reactionSpells.map(spellRow)}
                    {reactionFeatures.map((f) => (
                            <li key={`${f.source}-${f.id}`} className="action-item">
                                <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'feature', data: f })}>
                                    {f.name}
                                </button>
                                {featureButtons(f)}
                            </li>
                        ))}
                </ul>
            </li>

            <li className="action-list">
                <span className="action-title" id="feature-actions-title">Class Features</span>
                <ul className="action-set" id="feature-actions-set">
                    {(embersMax > 0 || crackMax > 0) && (
                        <li className="action-item">
                            <span className="caption-btn">
                                {embersMax > 0 && `Embers ${embers}/${embersMax}`}{embersMax > 0 && crackMax > 0 && ' \u00b7 '}{crackMax > 0 && `Cracks ${cracks}/${crackMax}`}
                            </span>
                            {crackMax > 0 && cracks >= 3 && (
                                <div className="action-button-container">
                                    <span className="caption-btn">{character.level >= 20 ? 'Shedding light, no Hide' : `Leak: take ${cracks} radiant at turn start, no Hide`}</span>
                                </div>
                            )}
                        </li>
                    )}
                    {listedFeatures.map((f) => (
                        <li key={`${f.source}-${f.id}`} className="action-item">
                            <button type="button" className="caption-btn" onClick={() => setOpenItem({ kind: 'feature', data: f })}>
                                {f.name}
                            </button>
                            {featureButtons(f)}
                        </li>
                    ))}
                </ul>
            </li>
            {runeNotes.length > 0 && (
                <li className="action-list">
                    <span className="action-title" id="rune-effects-title">Rune Effects</span>
                    <ul className="action-set" id="rune-effects-set">
                        {runeNotes.map((n) => <li key={n} className="action-item">{n}</li>)}
                    </ul>
                </li>
            )}
            {openItem && createPortal(
                <article className="spell-details">
                        <button type='button' className='spell-details-close' onClick={() => setOpenItem(null)}>X</button>
                        <h3 className='spell-details-title'>{openItem.data.name}</h3>
                    {openItem.kind === 'feature' && (
                        <>
                            <section className="details-container">
                                <section className="combat-box">
                                    <article className="combat-box-title"><h4>Feature Details</h4></article>
                                    <article className="combat-box-content">
                                        <p>Level: <strong>{openItem.data.level}</strong></p>
                                        <p>Type: <strong>{ACTION_LABELS[openItem.data.action_type]}</strong></p>
                                    </article>
                                </section>
                                <section className="spell-build-box">
                                    <article className="spell-build-box-title"><h4>Usage</h4></article>
                                    <article className="spell-build-box-content">
                                        <p>Uses: <strong>{openItem.data.uses}</strong></p>
                                        {openItem.data.dice && <p>Dice: <strong>{openItem.data.dice}</strong></p>}
                                    </article>
                                </section>
                            </section>
                            <section className="spell-description-box">
                                <p><strong>Description:</strong> <br /> {openItem.data.description}</p>
                            </section>
                        </>
                    )}

                    {openItem.kind === 'spell' && (
                        <>
                            <section className="details-container">
                                <section className="combat-box">
                                    <article className="combat-box-title"><h4>Spell Details</h4></article>
                                    <article className="combat-box-content">
                                        <p>Range: <strong>{openItem.data.range ? `${openItem.data.range} ft` : 'Reach'}</strong></p>
                                        <p>Duration: <strong>{Number(openItem.data.duration) === 0 ? 'instant' : `${openItem.data.duration} turns`}</strong></p>
                                        <p>Cast Time: <strong>{openItem.data.casting_time ? `${openItem.data.casting_time} turn(s)` : ''}</strong></p>
                                    </article>
                                </section>
                                <section className="spell-build-box">
                                    <article className="spell-build-box-title"><h4>Incantation</h4></article>
                                    <article className="spell-build-box-content">
                                        <p>State: {openItem.data.state_name && <img className="tile-icon" src={stateGlyph(openItem.data.state_name)} alt="" aria-hidden="true" onError={hideBrokenGlyph} />}<strong>{openItem.data.state_name ? `${openItem.data.state_name}` : ''}</strong></p> 
                                        <p>Element: {openItem.data.element_name && <img className="tile-icon" src={elementGlyph(openItem.data.element_name)} alt="" aria-hidden="true" onError={hideBrokenGlyph} />}<strong>{openItem.data.element_name ? `${openItem.data.element_name}` : ''}</strong></p>
                                        <p>Alignment: {openItem.data.alignment_name && <img className="tile-icon" src={alignmentGlyph(openItem.data.alignment_name)} alt="" aria-hidden="true" onError={hideBrokenGlyph} />}<strong className={bandClass(openItem.data.chart_band)}>{openItem.data.alignment_name ? `${openItem.data.alignment_name}` : ''}</strong></p>
                                    </article>
                                </section>
                            </section>
                            <section className="spell-description-box">
                                <p><strong>Description:</strong> <br /> {openItem.data.description}</p>
                            </section>
                        </>
                    )}

                    {openItem.kind === 'weapon' && (
                        <>
                            <section className="details-container">
                                <section className="combat-box">
                                    <article className="combat-box-title"><h4>Weapon Details</h4></article>
                                    <article className="combat-box-content">
                                        <p>Range: <strong>{openWeapon.range ?? 'Reach'}</strong></p>
                                        <p>Damage: <strong>{openWeapon.dice}{openWeapon.dmgMod ? signed(openWeapon.dmgMod) : ''}{openWeapon.damageType ? ` ${openWeapon.damageType}` : ''}</strong></p>
                                        <p>Stat: <strong>{statName(openWeapon.stat) ?? '-'}</strong></p>
                                        <p>Hands: <strong>{openWeapon.hands ?? '-'}</strong></p>
                                        <p>To Hit: <strong>{signed(openWeapon.hit ?? toHit)}</strong>{openWeapon.attackBonus ? <> (magic {signed(openWeapon.attackBonus)})</> : null}</p>
                                    </article>
                                </section>
                                {(openWeapon.oneHanded || ((isReaver || isRuneWeaver || isWraith) && openWeapon.weaponId)) && (
                                    <section className="spell-build-box">
                                        <article className="spell-build-box-title"><h4>Options</h4></article>
                                        <article className="spell-build-box-content">
                                            {openWeapon.oneHanded && (
                                                <>
                                                    <p>
                                                        <label>
                                                            <input type="checkbox" checked={openWeapon.dual} onChange={() => toggleDualWield(openWeapon)} /> Dual wield
                                                        </label>
                                                    </p>
                                                    {openWeapon.versatile && (
                                                        <p>
                                                            <label>
                                                                <input type="checkbox" checked={openWeapon.twoHand} onChange={() => toggleTwoHands(openWeapon)} /> Two hands
                                                            </label>
                                                        </p>
                                                    )}
                                                    <p>{openWeapon.dual ? 'Bonus action; no ability modifier on damage.' : openWeapon.twoHand ? `Attack action; two hands (${openWeapon.dice}).` : 'Attack action.'}</p>
                                                </>
                                            )}
                                            {isRuneWeaver && openWeapon.weaponId && (
                                                <RuneControl kind="weapon" itemId={openWeapon.weaponId} itemType="weapon" itemRunes={openWeapon.runes} isRunedWeapon={openWeapon.runed} />
                                            )}
                                            {isWraith && openWeapon.weaponId && (
                                                <>
                                                    <p>
                                                        <label>
                                                            <input type="checkbox" checked={openWeapon.marked} onChange={() => toggleSigilMark(openWeapon)} /> Sigil mark
                                                        </label>
                                                    </p>
                                                    <p>{openWeapon.marked ? 'Intellect for attack and damage; Sigil Strike and the Crack bonus apply.' : 'One weapon at a time.'}</p>
                                                </>
                                            )}
                                            {isReaver && openWeapon.weaponId && (
                                                <>
                                                    <p>
                                                        <label>
                                                            <input type="checkbox" checked={openWeapon.branded} onChange={() => toggleSoulBrand(openWeapon)} /> Soul Brand
                                                        </label>
                                                    </p>
                                                    <p>{openWeapon.branded ? `Confidence for attack and damage; Soul Strike +${soulStrikeDice} force.` : 'One weapon at a time.'}</p>
                                                </>
                                            )}
                                        </article>
                                    </section>
                                )}
                            </section>
                            {(openWeapon.rarity || openWeapon.description) && (
                                <section className="spell-description-box">
                                    {openWeapon.rarity && <p>Rarity: <strong>{openWeapon.rarity}</strong>{openWeapon.category ? ` \u00b7 ${openWeapon.category}` : ''}</p>}
                                    {openWeapon.description && <p><strong>Description:</strong> <br /> {openWeapon.description}</p>}
                                </section>
                            )}
                        </>
                    )}
                </article>
                , document.body)}
        </ul>
    );
}
export default Actions;
