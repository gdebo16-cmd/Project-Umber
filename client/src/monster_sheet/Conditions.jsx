import { Fragment } from 'react';
import { useCharacter } from './CharacterContext';

const GROUP_1 = ['blind', 'charm', 'deaf' ];
const GROUP_2 = ['lock', 'mad', 'disease'];
const GROUP_3 = ['panic', 'out', 'bleed'];
const GROUP_4 = ['ground', "weak", "sleep"];

function Conditions() {
    const { conditions, setConditions, exhaustion, setExhaustion } = useCharacter();
    const toggle = (name) => setConditions((prev) => ({ ...prev, [name]: !prev[name] }));

    const checkbox = (name) => (
        <Fragment key={name}>
          <div className='condition-type'>
            <label id={`${name}-label`} className="condition-label" htmlFor={name}>
                {name[0].toUpperCase() + name.slice(1)}
            </label>
            <input
                id={name}
                className="condition-checkbox"
                type="checkbox"
                checked={!!conditions[name]}
                onChange={() => toggle(name)}
            />
          </div>
        </Fragment>
    );

    return (
        <section className="conditions" id="conditions-container">
            <p className="conditions-title" id="condition-title">Afflictions</p>
            <article className="conditions-tile">
                <article className="conditions-list" id="conditions-list-1">
                    <ul className='conditions-set'>
                       <li className='conditions-item'>{GROUP_1.map(checkbox)}</li>
                    </ul>
                </article>
                <article className="conditions-list" id="conditions-list-2">
                    <ul className='conditions-set'>
                        <li className='conditions-item'>{GROUP_2.map(checkbox)}</li>
                    </ul>
                </article>
                <article className="conditions-list" id="conditions-list-4">
                    <ul className='conditions-set'>
                        <li className='conditions-item'>{GROUP_3.map(checkbox)}</li>
                    </ul>
                </article>
                <article className="conditions-list" id="conditions-list-5">
                    <ul className='conditions-set'>
                        <li className='conditions-item'>{GROUP_4.map(checkbox)}</li>
                    </ul>
                </article>
                <article className="exhaustion-tile" id="conditions-list-3">
                    <output className="exhaustion-output" htmlFor="exhaustion-value">Fatigue: {exhaustion}</output>
                    <input
                        id="exhaustion-value"
                        className="exhaustion-input"
                        type="range"
                        inputMode="numeric"
                        min="0"
                        max="8"
                        value={exhaustion}
                        style={{ '--fill': `${exhaustion * 12.5}%` }} /* how much of the track is accent, 0-8 -> 0-100% */
                        onChange={(e) => setExhaustion(Number(e.target.value))}
                    />
                    
                </article>
            </article>
        </section>
    );
}

export default Conditions;
