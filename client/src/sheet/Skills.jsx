import { modOf, signed, d20, proficiencyBonus } from '../utils/math';
import { SKILLS } from '../utils/stats';

// Skill value = modifier of its first stat + modifier of its second stat.
// Click a skill to roll a d20 + that value.
function Skills({ character, onRoll }) {
    return (
        <section className="container skills-container" id="skills-container">
                <p className="container-title tile-top" id="skills-title">Skills</p>
                {SKILLS.map((skill) => {
                    const [a, b] = skill.stats;
                    // proficient skills (class picks + fixed) add the proficiency bonus
                    const proficient = (character.skill_proficiencies ?? []).includes(skill.name);
                    const value = modOf(character[a]) + modOf(character[b]) + (proficient ? proficiencyBonus(character.level ?? 1) : 0);
                    return (
                        <article
                            key={skill.id}
                            className={`tile skill-tile hover-grow${proficient ? ' is-proficient' : ''}`}
                            title={proficient ? 'Proficient' : undefined}
                            id={`${skill.id}-container`}
                            onClick={() => onRoll(`${skill.name} check: ${d20() + value}`)}
                        >
                            <p className="tile-component label-component skill-label tile-top" id={`${skill.id}-label`}>{skill.name}</p>
                            <p className="tile-component value-component skill-value tile-bottom" id={`${skill.id}-value`}>{signed(value)}</p>
                        </article>
                    );
                })}
        </section>
    );
}

export default Skills;
