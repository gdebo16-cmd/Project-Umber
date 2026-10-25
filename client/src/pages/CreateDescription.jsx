// The picture + description box under the create-character forms.
// "item" is whatever was picked last ({ img, name, text }), or null to hide the box.
// renderFeature(f) is optional: extra UI under a feature (the Character Editor uses it for choice dropdowns).
function CreateDescription({ item, renderFeature }) {
    return (
        <section id="desc-container" className="step-1-desc-container" hidden={!item}>
            {item && (
                <article id="descArticle" className="step-1-desc-tile">
                    {item.img && <section id="img-section">
                      <img id="desc-img" src={item.img} alt={item.name} />
                    </section>}
                    {!item.hideTitle && <section id="titleSection">
                      <h3 id="title" className="title-text">{item.name}</h3>
                    </section>}
                    {!item.race && !item.sections && item.text && (
                        <section id="textSection" className="step-1-form">
                          <p id="text" className="text-block name-tile">{item.text}</p>
                        </section>
                    )}
                    {item.race && (<section id="traits-section">
                        <p>Type: {item.race.creature_type} | Size: {item.race.size} | Speed: {item.race.base_speed} ft</p>
                        {item.race.dark_vision && <p>Darkvision</p>}
                        {item.race.resistances && <p>Resistances: {item.race.resistances}</p>}
                        {item.race.lineage_bonuses?.map((b) => (
                            <p key={b.name}><strong>{b.name}:</strong> {b.description}</p>
                        ))}
                    </section>)}
                    {item.background && (<section id="traits-section">
                        {item.background.map((line) => <p key={line}>{line}</p>)}
                    </section>)}
                    {item.sections && (
                        <section id="class-info-section">
                            {item.sections.map((s) => (
                                <details key={s.label}>
                                    <summary>{s.label}</summary>
                                    <p>{s.body}</p>
                                </details>
                            ))}
                        </section>
                    )}
                    {item.features && (
                        <section id="tree-section">
                            {[...new Set(item.features.map((f) => f.level))].map((lvl) => (
                                <details key={lvl}>
                                    <summary>Level {lvl}</summary>
                                    {item.features.filter((f) => f.level === lvl).map((f) => (
                                        <div key={f.key ?? f.id ?? f.name} className="feature-entry">
                                            <p><strong>{f.name}:</strong> {f.description}</p>
                                            {renderFeature?.(f)}
                                        </div>
                                    ))}
                                </details>
                            ))}
                        </section>
                    )}
                </article>
            )}
        </section>
    );
}

export default CreateDescription;
