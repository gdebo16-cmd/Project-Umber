// A row of tab buttons. "tabs" is a list like [{ id: 'armor', label: 'Armor' }].
// prefix builds the same ids the EJS pages used, e.g. "inv" -> inv-tab-armor / inv-panel-armor.
import useTabSlider from '../hooks/useTabSlider';

function TabList({ tabs, active, onChange, prefix, className = 'action-tab-list', hidden }) {
    const { tabProps, barProps, slideStyle } = useTabSlider(tabs.findIndex((t) => t.id === active));
    return (
        <article className={className} role="tablist" hidden={hidden} {...barProps}>
            {tabs.map((t, i) => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`${prefix}tab-${t.id}`}
                    aria-controls={`${prefix}panel-${t.id}`}
                    aria-selected={active === t.id}
                    onClick={() => onChange(t.id)}
                    {...tabProps(i)}
                >
                    {t.label}
                </button>
            ))}
            <span className="slide" aria-hidden="true" style={slideStyle} />
        </article>
    );
}

export default TabList;
