import { Link } from 'react-router';
import LogoutLink from '../components/LogoutLink';

// The menu at the top of the character sheet (same links as character.ejs)
function SheetNav({ characterId }) {
    return (
        <nav id="navBox">
            <ul id="navContainer">
                <Link id="homeNav" className="drop-button navButton hover-grow" to="/home">home</Link>

                <li id="characterNav" className="navButton">Characters
                    <ul className="dropDown" id="characterDropdown">
                        <Link id="createCharacter" className="drop-button characterDropdownButton" to="/create_char">Create Character</Link>
                    </ul>
                </li>

                <li id="settingsNav" className="navButton">Settings
                    <ul className="dropDown" id="settingsDropdown">
                        <Link id="profile" className="drop-button settingsDropdownButton" to="/profile">Profile</Link>
                        <Link id="settings" className="drop-button settingsDropdownButton" to="/settings">Settings</Link>
                        <LogoutLink />
                    </ul>
                </li>

                <li id="campaignNav" className="navButton">Character Editor
                    <ul className="dropDown" id="campaignDropdown">
                        <Link id="charSheetEdit" className="drop-button campaignDropdownButton" to={`/characters/${characterId}/edit`}>Edit Character</Link>
                    </ul>
                </li>
            </ul>
        </nav>
    );
}

export default SheetNav;
