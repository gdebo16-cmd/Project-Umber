import { Link } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import signinCss from '../styles/signin.css?inline';
import SiteNav from '../components/SiteNav';
import { sendJson } from '../utils/api';


const THEMES = ['green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen'];
const DISPLAYS = ['standard', 'compact', 'neon'];

function ProfilePage() {
    usePageStyle(signinCss);



const pickTheme = async(e) => {
    const next = e.target.value;
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('siteTheme', next);
    await sendJson('/api/profile', 'PUT', { site_theme: next });
};

const pickDisplay = async(e) => {
    const next = e.target.value;
    document.documentElement.setAttribute('data-display', next);
    localStorage.setItem('siteDisplay', next);
    await sendJson('/api/profile', 'PUT', { site_display: next });
};

    return (
        <>
            <header id="topContainer">
                <SiteNav />
            </header>

            <main>
                <section className='container' id="title-container">
                    <article className='title' id="title-title">
                        <h1 id='main-title' className='title-text'>Profile</h1>
                    </article>
                </section>
                <section className='container' id="look-container">
                    <article className='tile' id="theme-tile">
                        <article className='title' id="look-title">
                            <h2 className='title-text'>Style</h2>
                        </article>
                        <article className='value' id="theme-value">
                            <article className='micro-tile' id="theme-micro-tile">
                            <label id="theme-label" className="tile-label cap-top" htmlFor="theme-select">Color scheme</label>
                            <select className="tile-value cap-bottom" id="theme-value" aria-label="Color scheme" defaultValue={localStorage.getItem('siteTheme') || 'light'} onChange={pickTheme}>
                                {THEMES.map((t) => (
                                <option className='option' id={`theme-option-${t}`} key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                            </article>
                            <article className='micro-tile' id="display-micro-tile">
                                <label id="display-label" className="tile-label cap-top" htmlFor="display-select">Display</label>
                                <select className="tile-value cap-bottom" id="display-select" aria-label="Display" onChange={pickDisplay}>
                                    {DISPLAYS.map((d) => (
                                    <option className='option' id={`display-option-${d}`} key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>
                                    ))}
                                </select>
                            </article>
                        </article>
                    </article>
                </section>
                <section className='container' id="info-container">
                  <article className='tile' id="name-tile"> 
                    <article className='title' id="info-title">
                        <h2 className="title-text">Information</h2>
                    </article>
                        <article className='value micro-tile' id="name-value">
                            <label id="name-label" className="tile-label cap-top" htmlFor="name-input">Name</label>
                                <img src={'/images/default-avatar.png'} alt="Avatar" className="tile-image" />
                        </article>
                    </article>
                </section>
            </main>
            <footer>
                <Link id="homeLink" to="/home">Back to home</Link>
                <p id="footerText">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default ProfilePage;
