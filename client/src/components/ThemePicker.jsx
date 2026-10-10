import { useState } from 'react';

const THEMES = ['green', 'purple', 'blue', 'red', 'orange', 'yellow', 'dark', 'light', 'hellfire', 'frozen'];

// The "Color scheme" dropdown. Saves your pick in localStorage like theme.js did.
function ThemePicker() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const change = (e) => {
        const next = e.target.value;
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    return (
        <article className="navButton" id="themeNav">
            <label className="cap-top" htmlFor="theme-select">Color scheme</label>
            <select className="cap-bottom" id="theme-select" aria-label="Color scheme" value={theme} onChange={change}>
                {THEMES.map((t) => (
                    <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
                ))}
            </select>
        </article>
    );
}

export default ThemePicker;
