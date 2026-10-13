import { Link } from 'react-router';
import LogoutLink from './LogoutLink';

// The menu on the home and settings pages (same links as home.ejs)
function SiteNav() {
    return (
        <nav id="navBox">
            <ul id="navContainer">
                <Link id="homeNav" className="navButton" to="/home">home</Link>

                <li id="characterNav" className="navButton">Characters
                    <ul className="dropDown" id="characterDropdown">
                        <Link id="createCharacter" className="characterDropdownButton" to="/create_char">Create Character</Link>
                    </ul>
                </li>
                <li id="settingsNav" className="navButton">Settings
                    <ul className="dropDown" id="settingsDropdown">
                        <Link id="profile" className="settingsDropdownButton" to="/profile">Profile</Link>
                        <Link id="settings" className="settingsDropdownButton" to="/settings">Settings</Link>
                        <LogoutLink />
                    </ul>
                </li>
            </ul>
        </nav>
    );
}

export default SiteNav;
