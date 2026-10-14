import { Link } from 'react-router';
import LogoutLink from '../components/LogoutLink';

// The menu at the top of the character sheet (same links as character.ejs)
function SheetNav({ characterId }) {
    return (
        <nav id="nav-box">
            <ul id="nav-container">
                <Link id="home-nav" className="btn-drop btn-nav hover-grow" to="/home">home</Link>

                <li id="character-nav" className="btn-nav">Characters
                    <ul className="drop-down" id="characterDropdown">
                        <Link id="createCharacter" className="btn-drop btn-drop-character" to="/create_char">Create Character</Link>
                    </ul>
                </li>

                <li id="settings-nav" className="btn-nav">Settings
                    <ul className="drop-down" id="settingsDropdown">
                        <Link id="profile" className="btn-drop btn-drop-settings" to="/profile">Profile</Link>
                        <Link id="settings" className="btn-drop btn-drop-settings" to="/settings">Settings</Link>
                        <LogoutLink />
                    </ul>
                </li>

                <li id="campaign-nav" className="btn-nav">Character Editor
                    <ul className="drop-down" id="campaignDropdown">
                        <Link id="charSheetEdit" className="btn-drop btn-drop-campaign" to={`/characters/${characterId}/edit`}>Edit Character</Link>
                    </ul>
                </li>
            </ul>
        </nav>
    );
}

export default SheetNav;
