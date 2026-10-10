import { modOf } from './math';

function ArmorClass({ character, ownedArmor }) {
    const equipped = ownedArmor.filter((a) => a.is_equipped); 
    const armorBonus = equipped.filter((a) => a.armor_type !== 'shield')
    .reduce((sum, a) => sum + Number(a.ac_bonus || 0), 0);
    const shieldBonus = equipped.filter((a) => a.armor_type === 'shield')
    .reduce((sum, a) => sum + Number(a.ac_bonus || 0), 0);
    
    const ac = 10 + modOf(character.con) + armorBonus + shieldBonus;
    
    return (
        <section className='armorClass'>
            <article id='acContainer'>
                <h2 id='acTitle' className='cap-top'>Armor Class</h2>
                <p id='acValue'>{ac}</p>
            </article>
        </section>
    );
}

export default ArmorClass;