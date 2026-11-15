import { useCharacter } from '../CharacterContext';
import { backgroundLines } from '../../utils/background';





function ProficienciesTab() {
    const { character } = useCharacter();
    const pick = (k) => character[`${k}_name`] ? { bio: character[`${k}_bio`], flavor: character[`${k}_flavor`], perk: character[`${k}_perk`], state: character[`${k}_state`] } : null;
    const bg = backgroundLines({ upbringing: pick('upbringing'), lifestyle: pick('lifestyle'), outlook: pick('outlook') });

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
                    {bg.perks.length > 0 && (
                    <article className="proficiency-tile">
                        <h3 className="proficiency-title">Background</h3>
                        <ul className="proficiency-list">
                            {[...bg.story, ...bg.perks].map((line) => (
                                <li key={line}>
                                    <p className="proficiency-value">{line}</p>
                                </li>
                            ))}
                        </ul>
                    </article>
                    )}
                </li>
            </ul>
        </>
    );
}

export default ProficienciesTab;
