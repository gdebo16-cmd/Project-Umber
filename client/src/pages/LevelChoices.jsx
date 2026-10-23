// Per-level feature-choice dropdowns for the creator (step 2) and the editor (Class and Level tab).
// Class and subclass features that have options and are unlocked at the picked level are grouped
// by level, so a subclass's choices show up next to the class ones once a subclass is picked.
// picks is { "<source>:<feature id>": [values] }, the same shape as characters.feature_choices.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { KEPT_BOOST } from '../utils/levelChoices';
// allowed (optional): { [feature key]: [options] } from useBoostOptions; rows it names only show those options
// tileClass / rowClass / hintClass / hintTag / pickedClass (optional): let the creator reuse its own tile classes; defaults keep the editor look.
// hintTag 'button' renders the hint itself as the clickable text; pickedClass replaces bottomClass on a select while its hint shows.
function LevelChoices({ features, picks, onChange, topClass, bottomClass, allowed, tileClass = 'form-section tile pick-tile level-choices', rowClass, hintClass = 'pick-hint', hintTag: HintTag = 'p', pickedClass }) {
    // the picked option's full description, in the same popup as the sheet's spell cards: { label, name, text }
    const [details, setDetails] = useState(null);
    if (!features.length) return null;

    const pick = (f, i, value) => {
        const count = f.choice_count ?? 1;
        const next = Array.from({ length: count }, (_, j) => picks[f.key]?.[j] ?? '');
        next[i] = value;
        onChange({ ...picks, [f.key]: next });
        const text = f.option_info?.[value];
        if (text) setDetails({ label: f.label, name: value, text });
    };

    const popup = details && createPortal(
        <article className="spell-details">
            <button type="button" className="btn-round spell-details-close" aria-label="Close" onClick={() => setDetails(null)}>X</button>
            <h3 className="spell-details-title">{details.name}</h3>
            <section className="spell-description-box">
                <p><strong>{details.label}:</strong> <br /> {details.text}</p>
            </section>
        </article>,
        document.body);

    return [...new Set(features.map((f) => f.level))].map((lvl, n) => (
        <article key={lvl} className={tileClass}>
            <label className={topClass}>Level {lvl} Choices</label>
            {features.filter((f) => f.level === lvl).map((f) => {
                const count = f.choice_count ?? 1;
                const current = picks[f.key] ?? [];
                const info = f.option_info ?? {};
                return Array.from({ length: count }, (_, i) => {
                    const hasHint = Boolean(current[i] && info[current[i]]);
                    const view = () => setDetails({ label: f.label, name: current[i], text: info[current[i]] });
                    return (
                    <div key={`${f.key}:${i}`} className={rowClass}>
                        <select
                            className={hasHint && pickedClass ? pickedClass : bottomClass}
                            aria-label={f.label}
                            value={current[i] ?? ''}
                            onChange={(e) => pick(f, i, e.target.value)}
                        >
                            <option value="" disabled>{f.label}: pick one</option>
                            {f.options
                                // a kept boost (pre-rework) only shows while it is the current pick
                                .filter((o) => o === current[i] || (!current.includes(o) && o !== KEPT_BOOST))
                                .filter((o) => !allowed?.[f.key] || allowed[f.key].includes(o))
                                .map((o) => (
                                    <option key={o} value={o} title={info[o] ?? ''}>
                                        {f.label}: {o}
                                    </option>
                                ))}
                        </select>
                        {hasHint && (HintTag === 'button' ? (
                            <button type="button" className={hintClass} onClick={view}>
                                {current[i]}: tap to view
                            </button>
                        ) : (
                            <HintTag className={hintClass}>
                                <button type="button" className="btn btn-link hover-grow" onClick={view}>
                                    {current[i]}: tap to view
                                </button>
                            </HintTag>
                        ))}
                    </div>
                    );
                });
            })}
            {n === 0 && popup}
        </article>
    ));
}

export default LevelChoices;