// The picture + description box under the create-character forms.
// "item" is whatever was picked last ({ img, name, text }), or null to hide the box.
function CreateDescription({ item }) {
    return (
        <section id="desc-container" className="tile" hidden={!item}>
            {item && (
                <article id="descArticle">
                    <section id="img-section">
                      <img id="desc-img" className="topTile" src={item.img} alt={item.name} />
                    </section>
                    {!item.hideTitle && <section id="titleSection">
                      <h3 id="title" className="bottomTile">{item.name}</h3>
                    </section>}
                    {!item.race && !item.sections && item.text && (
                        <section id="textSection">
                          <p id="text" className="bottomTile">{item.text}</p>
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
                                        <p key={f.name}><strong>{f.name}:</strong> {f.description}</p>
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
