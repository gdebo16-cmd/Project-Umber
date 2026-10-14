import { useCharacter } from '../CharacterContext';





function ProficienciesTab() {
    const { character } = useCharacter();

    return (
        <>
            <h2 className="tab-title">Proficiencies</h2>
            <ul className="proficiency-list" id="proficienciesList">
                <li className="proficiency-item">
                    <article className="proficiency-tile">
                        <h3 className="proficiency-title">Armor Proficiency</h3>
                        <ul className="proficiency-list">
                            {(character.armor_proficiencies ?? '').split(',').filter(Boolean).map((p) => {
                                return (
                                    <li key={p}>
                                        <p className="proficiency-value">- {p}</p>
                                    </li>
                                )})}
            </ul>
                    </article>
                    <article className= "proficiency-tile">
                        <h3 className="proficiency-title">Weapon Proficiency</h3>
                        <ul className="proficiency-list">
                            {(character.weapon_proficiencies ?? '').split(',').filter(Boolean).map((p) => {
                                return (
                                    <li key={p}>
                                        <p className="proficiency-value">- {p}</p>
                                    </li>
                                )})}
                        </ul>
                    </article>
                    <article className="proficiency-tile">
                        <h3 className="proficiency-title">Tool Proficiency</h3>
                        <ul className="proficiency-list">
                            {(character.tool_proficiencies ?? '').split(',').filter(Boolean).map((p) => {
                                return (
                                    <li key={p}>
                                        <p className="proficiency-value">- {p}</p>
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
