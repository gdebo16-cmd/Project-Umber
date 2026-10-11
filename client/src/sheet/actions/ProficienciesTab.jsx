// Same placeholder as character.ejs (not loaded from the database yet)
function ProficienciesTab() {
    return (
        <>
            <h2 className="action-tab-title" id="proficiency-title">Proficiencies</h2>
            <ul id="proficienciesList">
                <li className="proficiencyItem">
                    <h3 className="proficiencyTitle" id="proficiencyTitle">Proficiency</h3>
                    <p className="proficiencyValue" id="proficiencyValue">Light Armor</p>
                </li>
            </ul>
        </>
    );
}

export default ProficienciesTab;
