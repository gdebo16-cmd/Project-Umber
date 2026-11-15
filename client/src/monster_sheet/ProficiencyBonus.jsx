import { signed, proficiencyBonus } from '../utils/math';

// Proficiency Bonus from the character's level (same math as skills, spells and class DC)
function ProficiencyBonus({ character }) {
    return (
        <section className='container' id='proficiency-bonus-container'>
            <article className='tile armor-class-tile' id='proficiency-bonus-tile-container'>
                <p className='tile-component label-component tile-top' id='proficiency-bonus-tile-label'>Proficiency</p>
                <p className='tile-component value-component tile-bottom' id='proficiency-bonus-tile-value'>{signed(proficiencyBonus(character.level ?? 1))}</p>
            </article>
        </section>
    );
}

export default ProficiencyBonus;
