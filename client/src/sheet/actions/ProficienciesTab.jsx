import { useCharacter } from '../CharacterContext';





function ProficienciesTab() {
    const { character } = useCharacter();

    return (
        <>
            <h2 className="tab-title" id="proficiency-title">Proficiencies</h2>
            <ul className="proficiency-list" id="proficienciesList">
                <li className="proficiencyItem">
                    <article className="proficiency-tile">
                        <h3 className="proficiencyTitle" id="proficiencyTitle">Armor Proficiency</h3>
                        <ul className="proficiencyList">
                            {(character.armor_proficiencies ?? '').split(',').filter(Boolean).map((p) => {
                                return (
                                    <li key={p}>
                                        <p className="proficiencyValue" id="proficiencyValue">- {p}</p>
                                    </li>
                                )})}
            </ul>
                    </article>
                    <article className= "proficiency-tile">
                        <h3 className="proficiencyTitle" id="proficiencyTitle">Weapon Proficiency</h3>
                        <ul className="proficiencyList">
                            {(character.weapon_proficiencies ?? '').split(',').filter(Boolean).map((p) => {
                                return (
                                    <li key={p}>
                                        <p className="proficiencyValue" id="proficiencyValue">- {p}</p>
                                    </li>
                                )})}
                        </ul>
                    </article>
                    <article className="proficiency-tile">
                        <h3 className="proficiencyTitle" id="proficiencyTitle">Tool Proficiency</h3>
                        <ul className="proficiencyList">
                            {(character.tool_proficiencies ?? '').split(',').filter(Boolean).map((p) => {
                                return (
                                    <li key={p}>
                                        <p className="proficiencyValue" id="proficiencyValue">- {p}</p>
                                    </li>
                                )})}
                        </ul>
                    </article>
                </li>
            </ul>
        </>
    );
}

export default ProficienciesTab;
