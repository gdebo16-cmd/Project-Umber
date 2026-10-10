import { Link } from 'react-router';
import useFetch from '../useFetch';
import usePageStyle from '../usePageStyle';
import homeCss from '../home.css?inline';
import SiteNav from '../SiteNav';

// Replaces views/home.ejs
function HomePage() {
    usePageStyle(homeCss);
    const { data, setData, loading, error } = useFetch('/api/home');

    const deleteCharacter = async (e, ch) => {
        e.preventDefault();   // the button sits inside the card's link, so don't follow the link
        e.stopPropagation();
        if (!window.confirm(`Delete ${ch.name}? This cannot be undone.`)) return;

        const res = await fetch(`/api/characters/${ch.id}`, { method: 'DELETE' });
        if (res.ok) {
            // remove it from the list on screen
            setData((prev) => ({ ...prev, characters: prev.characters.filter((c) => c.id !== ch.id) }));
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Failure is upon us: {error}</p>;

    const { username, characters } = data;

    return (
        <>
            <header id="topContainer">
                <h1 id="siteTitle">Welcome {username}, To Eldridia</h1>
                <SiteNav />
            </header>

            <main>
                <section id="currentCharacters" className="mainBlock tile">
                    <h3 className="topTile">Current Characters</h3>
                    <article className="bottomTile" id="characterList">
                        {characters.length === 0 ? (
                            <p>No Characters Available</p>
                        ) : (
                            <ul id="currentCharacterContainer">
                                {characters.map((ch) => (
                                    <li key={ch.id} className="currentCharacterItem">
                                        <Link to={`/characters/${ch.id}`} className="char-tile">
                                            <h3 className="currentCharacterName">{ch.name}</h3>
                                            <img className="currentCharacterImage" src="/utils/defaultimg.png" alt="Character Image" />
                                            <p className="currentCharacterRace">Race: {ch.race}</p>
                                            <p className="currentCharacterClass">Class: {ch.class}</p>
                                            <p className="currentCharacterSubclass">Sub-class: {ch.subclass}</p>
                                            <button type="button" className="deleteButton" onClick={(e) => deleteCharacter(e, ch)}>Delete</button>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>
                <section id="currentCampaign" className="mainBlock tile">
                    <h3 className="topTile">Current Campaigns</h3>
                    <article className="bottomTile" id="campaignList">
                        <p>No Campaigns Planned</p>
                    </article>
                </section>
                <section id="unfinishedCharacters" className="mainBlock tile">
                    <h3 className="topTile">Unfinished Work</h3>
                    <article className="bottomTile" id="unfinishedList">
                        <p>Youre All Caught Up!</p>
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
