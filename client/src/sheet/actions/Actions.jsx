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
            <article className="tile action-tile physical-actions-tile"> 
                <h3 className="tile-component title-component action-title" id="physical-actions-title">Physical Actions</h3>
                <ul className="action-list" id="physical-actions-list">
                    {actions.map((a) => (
                        <li key={a.key} className="tile-component action-tile-component action-item" id="physical-action-item">
                            <span className="tile-component label-component action-label" id="physical-action-label">{a.name}</span>
                            <div className="action-button-container">
                                <button type="button" className="tile-component action-button to-hit-component to-hit-button hover-grow" id="physical-action-to-hit-button" onClick={rollHit}>
                                    {signed(toHit)}
                                </button>
                                <button type="button" className="tile-component action-button damage-component damage-button hover-grow" id="physical-action-damage-button" onClick={() => rollDamage(a)}>
                                    {a.dice}{a.dmgMod ? signed(a.dmgMod) : ''}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </article>
            
            <article className="tile action-tile magical-actions-tile">
                <h3 className="tile-component title-component action-title" id="magical-actions-title">Magical Actions</h3>
                <ul className='action-list' id='magical-actions-list'>
                    <li key={signed.key} className='tile-component action-tile-component action-item' id='magical-action-item'>
                        <span className='tile-component label-component action-label' id='magical-action-label'>Action Spell</span>
                        <div className="action-button-container">
                            <button type="button" className="action-button tile-component to-hit-component to-hit-button hover-grow" id="magical-action-to-hit-button" onClick={rollHit}>
                            +2
                            </button>
                            <button type="button" className="action-button tile-component damage-component damage-button hover-grow" id="magical-action-damage-button" onClick={() => rollDamage({dice: '2d6', dmgMod: 2})}>
                            2d6 + 2
                            </button>
                        </div>
                    </li>
                </ul>
            </article>
            <article className="tile action-tile bonus-actions-tile">
                <h3 className="tile-component title-component action-title" id="bonus-actions-title">Bonus Actions</h3>
                <ul className="action-list" id='bonus-actions-list'>
                    <li key={signed.key} className='tile-component action-tile-component action-item' id='bonus-action-item'>
                        <span className='tile-component label-component action-label' id='bonus-action-label'>Bonus Action</span>
                        <div className="action-button-container">
                            <button type="button" className="tile-component to-hit-component to-hit-button hover-grow" id="bonus-action-to-hit-button" onClick={rollHit}>
                            +3
                            </button>
                            <button type="button" className="tile-component damage-component damage-button hover-grow" id="bonus-action-damage-button" onClick={() => rollDamage({dice: '1d6', dmgMod: 1})}>
                            1d6 + 1
                            </button>
                        </div>
                    </li>
                </ul>
            </article>
            <article className="tile action-tile reactions-tile">
                <h3 className="tile-component title-component action-title" id="reactions-title">Reactions</h3>
                <ul className="action-list" id='reactions-list'>
                    <li key={signed.key} className='tile-component action-tile-component action-item' id='reaction-item'>
                        <span className='tile-component label-component action-label' id='reaction-label'>Reaction</span>
                        <div className="action-button-container">
                            <button type="button" className="tile-component to-hit-component to-hit-button hover-grow" id="reaction-to-hit-button" onClick={rollHit}>
                            +5
                            </button>
                            <button type="button" className="tile-component damage-component damage-button hover-grow" id="reaction-damage-button" onClick={() => rollDamage({dice: '2d6', dmgMod: 2})}>
                            2d6 + 2
                            </button>
                        </div>
                    </li>
                </ul>
            </article>
            <article className="tile action-tile class-abilities-tile">
                <h3 className="tile-component label-component action-title" id="class-abilities-label">Class Abilities</h3>
                <ul className="action-list" id='class-abilities-list'>
                    <li key={signed.key} className='tile-component action-tile-component action-item' id='class-ability-item'>
                        <span className='tile-component label-component action-label' id='class-ability-label'>Class Action</span>
                    </li>
                </ul>
            </article>
        </>
    );
}

export default Actions;
