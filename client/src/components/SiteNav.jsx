import { Link } from 'react-router';
import LogoutLink from './LogoutLink';

// The menu on the home and settings pages (same links as home.ejs)
function SiteNav() {
    return (
        <nav id="nav-box">
            <ul id="nav-container">
                <Link id="home-nav" className="btn-nav" to="/home">home</Link>

                <li id="character-nav" className="btn-nav">Characters
                    <ul className="drop-down" id="characterDropdown">
                        <Link id="createCharacter" className="btn-drop-character" to="/create_char">Create Character</Link>
                    </ul>
                </li>
                <li id="settings-nav" className="btn-nav">Settings
                    <ul className="drop-down" id="settingsDropdown">
                        <Link id="profile" className="btn-drop-settings" to="/profile">Profile</Link>
                        <Link id="settings" className="btn-drop-settings" to="/settings">Settings</Link>
                        <LogoutLink />
                    </ul>
                </li>
            </ul>
        </nav>
    );
}

export default SiteNav;
