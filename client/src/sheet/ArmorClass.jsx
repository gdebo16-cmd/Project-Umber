import { modOf } from '../utils/math';

function ArmorClass({ character, ownedArmor }) {
    const equipped = ownedArmor.filter((a) => a.is_equipped); 
    const armorBonus = equipped.filter((a) => a.armor_type !== 'shield')
    .reduce((sum, a) => sum + Number(a.ac_bonus || 0), 0);
    const shieldBonus = equipped.filter((a) => a.armor_type === 'shield')
    .reduce((sum, a) => sum + Number(a.ac_bonus || 0), 0);
    
    const ac = 10 + modOf(character.con) + armorBonus + shieldBonus;
    
    return (
        <section className='container' id='armor-class-container'>
            <article className='tile armor-class-tile' id='armor-class-tile-container'>
                <p className='tile-component label-component cap-top' id='armor-class-tile-label'>Armor Class</p>
                <p className='tile-component value-component cap-bottom' id='armor-class-tile-value'>{ac}</p>
            </article>
        </section>
    );
}

export default ArmorClass;