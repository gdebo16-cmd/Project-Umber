import { modOf, signed, d20 } from '../utils/math';
import { SKILLS } from '../utils/stats';

// Skill value = modifier of its first stat + modifier of its second stat.
// Click a skill to roll a d20 + that value.
function Skills({ character, onRoll }) {
    return (
        <section className="skills">
            <h2 className="tabTitle" id="skillsTitle">Skills</h2>
            <article id="skillsContainer">
                {SKILLS.map((skill) => {
                    const [a, b] = skill.stats;
                    const value = modOf(character[a]) + modOf(character[b]);
                    return (
                        <article
                            key={skill.id}
                            className="skillContainer hover-grow"
                            id={`${skill.id}Container`}
                            onClick={() => onRoll(`${skill.name} check: ${d20() + value}`)}
                        >
                            <h3 className="skillTitle">{skill.name}</h3>
                            <p className="skillValue" id={`${skill.id}Value`}>{signed(value)}</p>
                        </article>
                    );
                })}
            </article>
        </section>
    );
}

export default Skills;
