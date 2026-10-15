// Per-level feature-choice dropdowns for the creator (step 2) and the editor (Class and Level tab).
// Class and subclass features that have options and are unlocked at the picked level are grouped
// by level, so a subclass's choices show up next to the class ones once a subclass is picked.
// picks is { "<source>:<feature id>": [values] }, the same shape as characters.feature_choices.

function LevelChoices({ features, picks, onChange, topClass, bottomClass }) {
    if (!features.length) return null;

    const pick = (f, i, value) => {
        const count = f.choice_count ?? 1;
        const next = Array.from({ length: count }, (_, j) => picks[f.key]?.[j] ?? '');
        next[i] = value;
        onChange({ ...picks, [f.key]: next });
    };

    return [...new Set(features.map((f) => f.level))].map((lvl) => (
        <article key={lvl} className="form-section tile pick-tile level-choices">
            <label className={topClass}>Level {lvl} Choices</label>
            {features.filter((f) => f.level === lvl).map((f) => {
                const count = f.choice_count ?? 1;
                const current = picks[f.key] ?? [];
                return Array.from({ length: count }, (_, i) => (
                    <select
                        key={`${f.key}:${i}`}
                        className={bottomClass}
                        aria-label={f.label}
                        value={current[i] ?? ''}
                        onChange={(e) => pick(f, i, e.target.value)}
                    >
                        <option value="" disabled>{f.label}: pick one</option>
                        {f.options
                            .filter((o) => o === current[i] || !current.includes(o))
                            .map((o) => (
                                <option key={o} value={o}>{f.label}: {o}</option>
                            ))}
                    </select>
                ));
            })}
        </article>
    ));
}

export default LevelChoices;