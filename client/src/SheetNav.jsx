import { Link } from 'react-router';
import ThemePicker from './ThemePicker';
import LogoutLink from './LogoutLink';

// The menu at the top of the character sheet (same links as character.ejs)
function SheetNav({ characterId }) {
    return (
        <nav id="navBox">
            <ul id="navContainer">
                <Link id="homeNav" className="navButton hover-grow" to="/home">home</Link>
                <ThemePicker />

                <li id="characterNav" className="navButton">Characters
                    <ul className="dropDown" id="characterDropdown">
                        <Link id="createCharacter" className="characterDropdownButton" to="/create_char">Create Character</Link>
                        <Link id="characterList" className="characterDropdownButton" to="/char_list">Character List</Link>
                    </ul>
                </li>

                <li id="campaignNav" className="navButton">Character Editor
                    <ul className="dropDown" id="campaignDropdown">
                        <Link id="charSheetEdit" className="campaignDropdownButton" to={`/characters/${characterId}/edit`}>Edit Character</Link>
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

export default SheetNav;
