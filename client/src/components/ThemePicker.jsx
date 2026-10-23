import { useState } from 'react';

const THEMES = ['default', 'green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen', 'neon', 'prestige', 'glass-green', 'glass-blue', 'glass-red', 'glass-orange', 'glass-yellow', 'glass-fire', 'dark-glass', 'light-glass', 'frozen-glass'];
// 'glass-blue' -> 'Glass Blue'
const pretty = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

// The "Color scheme" dropdown. Saves your pick in localStorage like theme.js did.
function ThemePicker() {
    const [theme, setTheme] = useState(localStorage.getItem('siteTheme') || 'default');

    const change = (e) => {
        const next = e.target.value;
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('siteTheme', next);
    };

    return (
        <article className="btn btn-nav" id="theme-nav">
            <label className="tile-top" htmlFor="theme-select">Color scheme</label>
            <select className="field tile-bottom" id="theme-select" aria-label="Color scheme" value={theme} onChange={change}>
                {THEMES.map((t) => (
                    <option key={t} value={t}>{pretty(t)}</option>
                ))}
            </select>
        </article>
    );
}

export default ThemePicker;
