// The picture + description box under the create-character forms.
// "item" is whatever was picked last ({ img, name, text }), or null to hide the box.
function CreateDescription({ item }) {
    return (
        <section id="descContainer" className="tile" hidden={!item}>
            {item && (
                <>
                    <img id="descImg" className="topTile" src={item.img} alt={item.name} />
                    <p id="descText" className="bottomTile">{item.text}</p>
                </>
            )}
        </section>
    );
}

export default CreateDescription;
