import SheetNav from './SheetNav';

function CharacterHeader({ character }) {
    return (
        <header>
            <section id='siteTitle'>
                <h1>Eldrid Tales</h1>
            </section>
            <section id='characterHeader'>
                <h2 id='characterName'>{character.name} - Level: {character.level}</h2>
                <p id='characterRace'>{character.race_name}</p>
                <p id='characterClass'>{character.class_name} - {character.subclass_name}</p>
            </section>
            <SheetNav characterId={character.id} />
        </header>
    );
}

export default CharacterHeader;
