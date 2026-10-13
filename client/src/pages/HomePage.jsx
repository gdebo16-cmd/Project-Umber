import { useState } from 'react';
import { Link } from 'react-router';
import useFetch from '../hooks/useFetch';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import SiteNav from '../components/SiteNav';

function HomePage() {
    usePageStyle(homeCss);
    const { data, setData, loading, error } = useFetch('/api/home');
    const [homeTab, setHomeTab] = useState('current'); // which section shows on mobile

    const deleteCharacter = async (e, ch) => {
        e.preventDefault();   // the button sits inside the card's link, so don't follow the link
        e.stopPropagation();
        if (!window.confirm(`Do you want to delete ${ch.name}? This cannot be undone.`)) return;

        const res = await fetch(`/api/characters/${ch.id}`, { method: 'DELETE' });
        if (res.ok) {
            // remove it from the list on screen
            setData((prev) => ({ ...prev, characters: prev.characters.filter((c) => c.id !== ch.id) }));
        }
    };

    const deleteDraft = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Delete this unfinished character?')) return;
        const res = await fetch('/api/create_char/draft', { method: 'DELETE' });
        if (res.ok) setData((prev) => ({ ...prev, draft: null }));
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { username, characters, draft } = data;

    return (
        <>
            <header id="siteTitle">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="titleLogo" />
                <h1>Welcome {username}!</h1>
            </header>
            <SiteNav />
            <main>
                <nav className="home-tabs">
                    <button type="button" className={homeTab === 'current' ? 'home-tab active' : 'home-tab'} onClick={() => setHomeTab('current')}>Current Characters</button>
                    <button type="button" className={homeTab === 'unfinished' ? 'home-tab active' : 'home-tab'} onClick={() => setHomeTab('unfinished')}>Unfinished Work</button>
                </nav>
                <section id="current-character-container" className={homeTab === 'current' ? 'container tab-active' : 'container'}>
                    <article className="title" id="current-character-title">
                        <h2 className="title-text">Current Characters</h2>
                    </article>
                    <article className="tile" id="current-character-tile">
                        {characters.length === 0 ? (
                            <p>No Characters Available</p>
                        ) : (
                            <ul className="tile-list" id="current-character-list">
                                {characters.map((ch) => (
                                    <li key={ch.id} className='character-tile' id={`character-tile-${ch.id}`}>
                                        <Link to={`/characters/${ch.id}`} className="char-tile">
                                            <h3 className="character-name">{ch.name}</h3>
                                            <img className="character-image" src="/utils/defaultimg.png" alt="Character Image" />
                                            <p className="character-race">Race: {ch.race}</p>
                                            <p className="character-class">Class: {ch.class}</p>
                                            <p className="character-subclass">Sub-class: {ch.subclass}</p>
                                            <button type="button" className="character-delete-button" onClick={(e) => deleteCharacter(e, ch)}>Delete</button>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>
                <section id="current-campaign-container" className="container" hidden>
                    <article className="title" id="current-campaign-title">
                        <h2 className="title-text">Current Campaigns</h2>
                    </article>
                    <article className="tile" id="current-campaign-list">
                        <p className="tile-text">No Campaigns Planned</p>
                    </article>
                </section>
                <section id="unfinished-character-container" className={homeTab === 'unfinished' ? 'container tab-active' : 'container'}>
                    <article className="title" id="unfinished-character-title">
                        <h2 className="title-text">Unfinished Work</h2>
                    </article>
                    <article className="tile" id="unfinished-character-tile">
                        <ul className="tile-list" id="unfinished-character-list">
                        {draft ? (
                            <li key={draft.id} className='character-tile' id={`character-tile-${draft.id}`}>
                                <Link to={draft.subclass_id ? '/create_char/step3' : '/create_char/step2'} className='char-tile'>
                                    <h3 className='character-name'>{draft.name || 'One with no name'}</h3>
                                    <img className='character-image' src='/utils/defaultimg.png' alt='Character Image' />
                                    <p className='character-race'>Race: {draft.race || 'Undecided'}</p>
                                    <p className='character-class'>Class: {draft.class || 'Undecided'}</p>
                                    <p className='character-subclass'>Sub-class: {draft.subclass || 'Undecided'}</p>
                                    <button type='button' className='character-delete-button' onClick={deleteDraft}>Delete</button>
                                </Link>
                            </li>
                        ) : (
                            <p className='tile-text'>You are all caught up!</p>
                        )}
                        </ul>
                    </article>
                </section>
            </main>
            <footer>
                <p id="footerText">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default HomePage;
