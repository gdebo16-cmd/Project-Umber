import { useSyncExternalStore } from 'react';
import { useCharacter } from './CharacterContext';
import SheetNav from './SheetNav';

// desktop shows the character header above the nav; phones keep nav first
const DESKTOP = '(min-width: 769px)';
const subscribe = (cb) => { const mq = window.matchMedia(DESKTOP); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb); };
const isDesktop = () => window.matchMedia(DESKTOP).matches;


// Same page setup as the other pages: header#site-title (logo + h1), then the nav
function CharacterHeader({ character }) {
    const desktop = useSyncExternalStore(subscribe, isDesktop);
    const { hp } = useCharacter();
    const max = character.max_hp;
    return (
        <>
            <header id="site-title">
                {/* phone-only copy of the portrait, shown beside the logo */}
                <span className='portrait-frame'><img className='title-portrait' src={character.portrait_url ?? '/default-character.png'} alt="" aria-hidden="true" /></span>
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" id='logo' />
            </header>
            {!desktop && <SheetNav characterId={character.id} />}
            <section id='character-header'>
                <h2 className='header-cell' id='character-name'>
                    <span className='portrait-frame'><img className='character-portrait' src={character.portrait_url ?? '/default-character.png'} alt={`Portrait of ${character.name}`} /></span>
                    {character.name} - Level: {character.level}
                </h2>
                <h2 className='header-cell' id='character-race'>{character.race_name}{character.subrace_name && ` (${character.subrace_name})`}</h2>
                <h2 className='header-cell' id='character-class'>{character.class_name}{character.subclass_name && ' - ' + character.subclass_name}</h2>
            </section>
            <article className='hp-bar-tile'>
                <div className={`hp-bar ${hp <= max / 4 ? 'very_hurt' : hp <= max / 2 ? 'hurt' : ''}` } id='hp-bar-fill' style={{ width: `${Math.min(100, Math.max(0, max ? (hp / max) * 100 : 0))}%` }}>
                </div>
            </article>
            {desktop && <SheetNav characterId={character.id} />}
        </>
    );
}

export default CharacterHeader;
