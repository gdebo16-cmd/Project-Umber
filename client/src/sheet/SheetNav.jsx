import { Link } from 'react-router';
import LogoutLink from '../components/LogoutLink';
import useTabSlider from '../hooks/useTabSlider';

// the sheet and its sub-pages sit under Character Editor (tab 3)
const SHEET_TAB = 3;

// The menu at the top of the character sheet (same links as character.ejs)
function SheetNav({ characterId }) {
    const { tabProps, barProps, slideStyle } = useTabSlider(SHEET_TAB);
    return (
        <nav id="nav-box">
            <ul id="nav-container" {...barProps}>
                <li className="slide" aria-hidden="true" style={slideStyle} />
                <Link id="home-nav" className="btn btn-nav" to="/home" {...tabProps(0)}>home</Link>

                <li id="character-nav" className="btn btn-nav" {...tabProps(1)}>Adventure
                    <ul className="drop-down" id="characterDropdown">
                        <Link id="createCharacter" className="btn-drop-character" to="/create_char">Create Character</Link>
                        <Link id="createCampaign" className="btn-drop-character" to="/create_campaign">Create Campaign</Link>
                        <Link id="campaignList" className="btn-drop-character" to="/campaign_list">Campaign List</Link>
                    </ul>
                </li>

                <li id="settings-nav" className="btn btn-nav" {...tabProps(2)}>Settings
                    <ul className="drop-down" id="settingsDropdown">
                        <Link id="profile" className="btn-drop-settings" to="/profile">Profile</Link>
                        <Link id="settings" className="btn-drop-settings" to="/settings">Settings</Link>
                        <LogoutLink />
                    </ul>
                </li>

                <li id="campaign-nav" className="btn btn-nav" {...tabProps(3)}>Character Editor
                    <ul className="drop-down" id="campaignDropdown">
                        <Link id="charSheetEdit" className="btn-drop-campaign" to={`/characters/${characterId}/edit`}>Edit Character</Link>
                    </ul>
                </li>
            </ul>
        </nav>
    );
}

export default SheetNav;
