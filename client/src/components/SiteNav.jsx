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
                        <Link id="characterList" className="characterDropdownButton" to="/char_list">Character List</Link>
                    </ul>
                </li>

                <li id="campaignNav" className="navButton">Campaigns
                    <ul className="dropDown" id="campaignDropdown">
                        <Link id="createCampaign" className="campaignDropdownButton" to="/create_campaign">Create Campaign</Link>
                        <Link id="campaignList" className="campaignDropdownButton" to="/campaign_list">Campaign List</Link>
                        <Link id="premadeCampaigns" className="campaignDropdownButton" to="/premade">Premade Campaigns</Link>
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
