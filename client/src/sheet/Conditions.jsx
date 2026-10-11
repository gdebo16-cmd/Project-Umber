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
                className="condition-checkbox"
                type="checkbox"
                checked={!!checked[name]}
                onChange={() => toggle(name)}
            />
        </Fragment>
    );

    return (
        <section className="container condition-container" id="conditions-container">
            <p className="tile-component label-component cap-top" id="condition-title">Conditions</p>
            <article className="tile condition-tile">
                <article className="tile-component list-component" id="conditions-list-1">{GROUP_1.map(checkbox)}</article>
                <article className="tile-component list-component" id="conditions-list-2">{GROUP_2.map(checkbox)}</article>
                <article className="tile-component list-component" id="conditions-list-3">
                    <label id="exhausted-label" className="tile-component exhausted-component label-component" htmlFor="exhausted-value">Exhausted</label>
                    <input
                        id="exhausted-value"
                        className="tile-component exhausted-component range-component"
                        type="range"
                        inputMode="numeric"
                        min="0"
                        max="10"
                        value={exhaustion}
                        onChange={(e) => setExhaustion(Number(e.target.value))}
                    />
                    <output htmlFor="exhausted-value">{exhaustion}</output>
                </article>
            </article>
        </section>
    );
}

export default Conditions;
