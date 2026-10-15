import SheetNav from './SheetNav';

function CharacterHeader({ character }) {
    return (
        <header>
            <section id='site-title'>
              <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" id='logo' />
              
            </section>
            <section id='character-header'>
                <img className='header-cell character-portrait' src={character.portrait_url ?? '/default-character.png'} alt={`Portrait of ${character.name}`} />
                <h2 className='header-cell' id='character-name'>{character.name} - Level: {character.level}</h2>
                <p className='header-cell' id='character-race'>{character.race_name}{character.subrace_name && ` (${character.subrace_name})`}</p>
                <p className='header-cell' id='character-class'>{character.class_name}{character.subclass_name && ' - ' + character.subclass_name}</p>
            </section>
            <SheetNav characterId={character.id} />
        </header>
    );
}

export default CharacterHeader;
