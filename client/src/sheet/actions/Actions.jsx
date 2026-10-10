import { modOf, signed, healthInit, rollDice, d20 } from '../../utils/math';

// Your equipped weapons plus Fists. Each has a To Hit button and a Damage button.
function Actions({ character, hp, ownedWeapons, onRoll }) {
    const init = modOf(character.dex) + healthInit(hp, character.max_hp);
    const strMod = modOf(character.str);
    const toHit = init + strMod;

    // Fists get weaker as you get hurt. Always at least 1d4.
    const fistDice = `${Math.max(1, Math.floor((character.str + hp) / 20))}d4`;

    // Every action has the same shape, so one map() can draw them all
    const actions = [
        ...ownedWeapons.filter((w) => w.is_equipped).map((w) => {
            const dmgMod = w.category === 'ranged' ? modOf(character.dex) : strMod;
            return { key: `w${w.id}`, name: w.name, dice: w.damage_dice, dmgMod };
        }),
        { key: 'fists', name: 'Fists', dice: fistDice, dmgMod: 0 },
    ];

    const rollHit = () => onRoll(`Chance to hit: ${d20() + toHit}`);
    const rollDamage = (a) => onRoll(`Damage dealt: ${Math.max(0, rollDice(a.dice) + a.dmgMod)}`);

    return (
        <>
            <h3 className="actionTitle cap-top">Physical Actions</h3>
            <ul id="actionsList">
                {actions.map((a) => (
                    <li key={a.key} className="actionItem">
                        <div className="actionLabelContainer">
                            <span className="actionLabel">{a.name}</span>
                        </div>
                        <div className="actionButtonContainer">
                            <button type="button" className="toHitButton hover-grow" onClick={rollHit}>
                                {signed(toHit)}
                            </button>
                            <button type="button" className="damageButton hover-grow" onClick={() => rollDamage(a)}>
                                {a.dice}{a.dmgMod ? signed(a.dmgMod) : ''}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            <h3 className="actionTitle cap-top">Magical Actions</h3>
            <ul id='spellActionsList'>
                <li key={signed.key} className='spellActionItem'>
                    <div className='spellActionLabelContainer'>
                        <span className='spellActionLabel'>Action Spell</span>
                    </div>
                </li>
            </ul>
            <h3 className="actionTitle cap-top">Bonus Actions</h3>
            <ul id='bonusActionsList'>
                <li key={signed.key} className='spellActionItem'>
                    <div className='spellActionLabelContainer'>
                        <span className='spellActionLabel'>Bonus Action</span>
                    </div>
                </li>
            </ul>
            <h3 className="actionTitle cap-top">Reactions</h3>
            <ul id='reactionsActionsList'>
                <li key={signed.key} className='spellActionItem'>
                    <div className='spellActionLabelContainer'>
                        <span className='spellActionLabel'>Reaction</span>
                    </div>
                </li>
            </ul>
            <h3 className="actionTitle cap-top">Class Abilities</h3>
            <ul id='classActionsList'>
                <li key={signed.key} className='spellActionItem'>
                    <div className='spellActionLabelContainer'>
                        <span className='spellActionLabel'>Class Action</span>
                    </div>
                </li>
            </ul>
        </>
    );
}

export default Actions;
