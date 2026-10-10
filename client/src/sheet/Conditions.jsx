import { Fragment, useState } from 'react';

// Same three groups as character.ejs
const GROUP_1 = ['blinded', 'charmed', 'deafened', 'frightened'];
const GROUP_2 = ['paralyzed', 'petrified', 'poisoned', 'prone'];

// Conditions and Exhaustion live only in React state for now (the EJS page didn't save them either),
// so they reset when you reload the page.
function Conditions() {
    const [checked, setChecked] = useState({}); // e.g. { blinded: true }
    const [exhaustion, setExhaustion] = useState(0);

    const toggle = (name) => setChecked((prev) => ({ ...prev, [name]: !prev[name] }));

    const checkbox = (name) => (
        <Fragment key={name}>
            <label id={`${name}Label`} className="conditionLabel" htmlFor={name}>
                {name[0].toUpperCase() + name.slice(1)}
            </label>
            <input
                id={name}
                className="conditionCheckbox"
                type="checkbox"
                checked={!!checked[name]}
                onChange={() => toggle(name)}
            />
        </Fragment>
    );

    return (
        <section className="condition">
            <p id="conditionsTitle" className="cap-top">Conditions</p>
            <article id="conditionsContainer">
                <article id="conditionsList">{GROUP_1.map(checkbox)}</article>
                <article id="conditionsList2">{GROUP_2.map(checkbox)}</article>
                <article id="conditionsList3">
                    <label id="exhaustedLabel" className="conditionLabel" htmlFor="exhaustedValue">Exhausted</label>
                    <input
                        id="exhaustedValue"
                        className="conditionRange"
                        type="range"
                        inputMode="numeric"
                        min="0"
                        max="10"
                        value={exhaustion}
                        onChange={(e) => setExhaustion(Number(e.target.value))}
                    />
                    <output htmlFor="exhaustedValue">{exhaustion}</output>
                </article>
            </article>
        </section>
    );
}

export default Conditions;
