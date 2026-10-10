// A row of tab buttons. "tabs" is a list like [{ id: 'armor', label: 'Armor' }].
// prefix builds the same ids the EJS pages used, e.g. "inv" -> inv-tab-armor / inv-panel-armor.
function TabList({ tabs, active, onChange, prefix, className = 'tab-list', hidden }) {
    return (
        <article className={className} role="tablist" hidden={hidden}>
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`${prefix}tab-${t.id}`}
                    aria-controls={`${prefix}panel-${t.id}`}
                    aria-selected={active === t.id}
                    onClick={() => onChange(t.id)}
                >
                    {t.label}
                </button>
            ))}
        </article>
    );
}

export default TabList;
