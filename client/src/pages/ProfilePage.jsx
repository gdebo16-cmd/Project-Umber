import { Link } from 'react-router';
import usePageStyle from '../hooks/usePageStyle';
import homeCss from '../styles/home.css?inline';
import SiteNav from '../components/SiteNav';
import { sendJson } from '../utils/api';


const THEMES = ['default', 'green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen', 'neon', 'prestige', 'glass-green', 'glass-blue', 'glass-red', 'glass-orange', 'glass-yellow', 'glass-fire', 'dark-glass', 'light-glass', 'frozen-glass'];
// 'glass-blue' -> 'Glass Blue'
const pretty = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const DISPLAYS = ['standard', 'compact', 'neon', 'glass', 'parchment', 'minimal', 'bold'];
const BACKGROUNDS = ['default', 'green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen', 'neon', 'dark-map', 'light-map', 'hellfire-map', 'frozen-map'];

function ProfilePage() {
    usePageStyle(homeCss, null, 'page-home');



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
            <header id="site-title">
                <img src="/Logo.png" alt="Eldrid Tales Logo" className="title-logo" />
                <h1>Profile</h1>  
            </header>
            <SiteNav />
            <main id="profile-main">
                <section>
                        <article className="form-section profile-tile" id="profile-username-container">
                            <label id="theme-label" className="tile-label tile-top" htmlFor="theme-select">Color scheme</label>
                            <select className="tile-value tile-bottom" id="theme-value" aria-label="Color scheme" defaultValue={localStorage.getItem('siteTheme') || 'default'} onChange={pickTheme}>
                                {THEMES.map((t) => (
                                <option className='option' id={`theme-option-${t}`} key={t} value={t}>{pretty(t)}</option>
                                ))}
                            </select>
                        </article>
                        <article className="form-section profile-tile" id="profile-email-container">
                            <label id="display-label" className="tile-label tile-top" htmlFor="display-select">Display</label>
                            <select className="tile-value tile-bottom" id="display-select" aria-label="Display" defaultValue={localStorage.getItem('siteDisplay') || 'standard'} onChange={pickDisplay}>
                                {DISPLAYS.map((d) => (
                                <option className='option' id={`display-option-${d}`} key={d} value={d}>{pretty(d)}</option>
                                ))}
                            </select>
                        </article>
                        <article className="form-section profile-tile" id="profile-background-container">
                            <label id="background-label" className="tile-label tile-top" htmlFor="background-select">Background</label>
                            <select className="tile-value tile-bottom" id="background-select" aria-label="Background" defaultValue={localStorage.getItem('siteBackground') || 'default'} onChange={pickBackground}>
                                {BACKGROUNDS.map((b) => (
                                <option className='option' id={`background-option-${b}`} key={b} value={b}>{pretty(b)}</option>
                                ))}
                            </select>
                        </article>
                        <article className="form-section profile-tile" id="profile-username-container">
                            <label id="img-label" className="tile-label tile-top" htmlFor="img-input">Character Image</label>
                            <img src={'/images/default-avatar.png'} alt="Avatar" className='tile-value tile-bottom'/>
                        </article>
                </section>
            </main>
            <footer>
                <Link id="home-link" to="/home">Back to home</Link>
                <p id="footer-text">copyrite Eldrid Tales LLC</p>
            </footer>
        </>
    );
}

export default ProfilePage;
