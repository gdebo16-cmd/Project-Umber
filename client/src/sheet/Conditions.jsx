import { Fragment } from 'react';
import { useCharacter } from './CharacterContext';

const GROUP_1 = ['blinded', 'charmed', 'deafened', 'frightened'];
const GROUP_2 = ['paralyzed', 'petrified', 'poisoned', 'prone'];

function Conditions() {
    const { conditions, setConditions, exhaustion, setExhaustion } = useCharacter();
    const toggle = (name) => setConditions((prev) => ({ ...prev, [name]: !prev[name] }));

    const checkbox = (name) => (
        <Fragment key={name}>
            <label id={`${name}Label`} className="conditionLabel" htmlFor={name}>
                {name[0].toUpperCase() + name.slice(1)}
            </label>
            <input
                id={name}
                className="condition-checkbox"
                type="checkbox"
                checked={!!conditions[name]}
                onChange={() => toggle(name)}
            />
        </Fragment>
    );

    return (
        <section className="container condition-container" id="conditions-container">
            <p className="tile-component label-component tile-top" id="condition-title">Conditions</p>
            <article className="tile-cell condition-tile">
                <article className="list-component" id="conditions-list-1">{GROUP_1.map(checkbox)}</article>
                <article className="list-component" id="conditions-list-2">{GROUP_2.map(checkbox)}</article>
                <article className="list-component" id="conditions-list-3">
                    <label id="exhausted-label" className="tile-component exhausted-component label-component" htmlFor="exhausted-value">Exhausted</label>
                    <input
                        id="exhausted-value"
                        className="tile-component exhausted-component range-component"
                        type="range"
                        inputMode="numeric"
                        min="0"
                        max="10"
                        value={exhaustion}
                        style={{ '--fill': `${exhaustion * 10}%` }} /* how much of the track is accent, 0-10 -> 0-100% */
                        onChange={(e) => setExhaustion(Number(e.target.value))}
                    />
                    <output htmlFor="exhausted-value">{exhaustion}</output>
                </article>
            </article>
        </section>
    );
}

export default Conditions;
