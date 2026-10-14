import { Link } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import SiteNav from '../components/SiteNav';
import { sendJson } from '../utils/api';


const THEMES = ['default', 'green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen', 'neon'];
const DISPLAYS = ['standard', 'compact', 'neon'];
const BACKGROUNDS = ['default', 'green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen', 'neon'];

function ProfilePage() {
    usePageStyle(homeCss);



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

const pickBackground = async(e) => {
    const next = e.target.value;
    document.documentElement.setAttribute('data-background', next);
    localStorage.setItem('siteBackground', next);
    await sendJson('/api/profile', 'PUT', { site_background: next });
};

    return (
        <>
            <header id="siteTitle">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="titleLogo" />
                <h1>Profile</h1>  
            </header>
            <SiteNav />
            <main id="profile-main">
                <section>
                        <article className="formSectionContainer profile-tile" id="profile-username-container">
                            <label id="theme-label" className="tile-label cap-top" htmlFor="theme-select">Color scheme</label>
                            <select className="tile-value cap-bottom" id="theme-value" aria-label="Color scheme" defaultValue={localStorage.getItem('siteTheme') || 'default'} onChange={pickTheme}>
                                {THEMES.map((t) => (
                                <option className='option' id={`theme-option-${t}`} key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </article>
                        <article className="formSectionContainer profile-tile" id="profile-email-container">
                            <label id="display-label" className="tile-label cap-top" htmlFor="display-select">Display</label>
                            <select className="tile-value cap-bottom" id="display-select" aria-label="Display" onChange={pickDisplay}>
                                {DISPLAYS.map((d) => (
                                <option className='option' id={`display-option-${d}`} key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>
                                ))}
                            </select>
                        </article>
                        <article className="formSectionContainer profile-tile" id="profile-background-container">
                            <label id="background-label" className="tile-label cap-top" htmlFor="background-select">Background</label>
                            <select className="tile-value cap-bottom" id="background-select" aria-label="Background" defaultValue={localStorage.getItem('siteBackground') || 'default'} onChange={pickBackground}>
                                {BACKGROUNDS.map((b) => (
                                <option className='option' id={`background-option-${b}`} key={b} value={b}>{b[0].toUpperCase() + b.slice(1)}</option>
                                ))}
                            </select>
                        </article>
                        <article className="formSectionContainer profile-tile" id="profile-username-container">
                            <label id="img-label" className="tile-label cap-top" htmlFor="img-input">Character Image</label>
                            <img src={'/images/default-avatar.png'} alt="Avatar" className='tile-value cap-bottom'/>
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
