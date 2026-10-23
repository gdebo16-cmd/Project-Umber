import { Link, useLocation } from 'react-router';
import LogoutLink from './LogoutLink';
import useTabSlider from '../hooks/useTabSlider';

// which tab matches the current page
function activeIndex(path) {
    if (path.startsWith('/home')) return 0;
    if (['/create_char', '/create_campaign', '/campaign_list'].some((p) => path.startsWith(p))) return 1;
    if (['/profile', '/settings'].some((p) => path.startsWith(p))) return 2;
    return -1;
}

// The menu on the home and settings pages (same links as home.ejs)
function SiteNav() {
    const { pathname } = useLocation();
    const { tabProps, barProps, slideStyle } = useTabSlider(activeIndex(pathname));

    return (
        <nav id="nav-box">
            <ul id="nav-container" {...barProps}>
                <li className="slide" aria-hidden="true" style={slideStyle} />
                <Link id="home-nav" className="btn btn-nav" to="/home" {...tabProps(0)}>home</Link>

                <li id="character-nav" className="btn btn-nav" {...tabProps(1)}>Adventures
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
            </ul>
        </nav>
    );
}

export default SiteNav;
