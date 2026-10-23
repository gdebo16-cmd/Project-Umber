import { modOf } from '../utils/math';
import { armorRuneEffects } from '../utils/runes';

function ArmorClass({ character, ownedArmor }) {
    const equipped = ownedArmor.filter((a) => a.is_equipped); 
    const armorBonus = equipped.filter((a) => a.armor_type !== 'shield')
    .reduce((sum, a) => sum + Number(a.ac_bonus || 0), 0);
    const shieldBonus = equipped.filter((a) => a.armor_type === 'shield')
    .reduce((sum, a) => sum + Number(a.ac_bonus || 0), 0);
    
    // Guard Rune +1 AC; Warding Rune resistances (equipped armor and shields)
    const runes = armorRuneEffects(ownedArmor);
    // Body armor caps the CON mod (armor.con_cap: light/none = no cap, medium 2, heavy 0)
    const caps = equipped.filter((a) => a.armor_type !== 'shield' && a.con_cap != null).map((a) => Number(a.con_cap));
    const conMod = caps.length ? Math.min(modOf(character.con), ...caps) : modOf(character.con);
    const ac = 10 + conMod + armorBonus + shieldBonus + runes.acBonus;
    
    return (
        <section className='container' id='armor-class-container'>
            <article className='tile armor-class-tile' id='armor-class-tile-container'>
                <p className='tile-component label-component tile-top' id='armor-class-tile-label'>Armor Class</p>
                <p className='tile-component value-component tile-bottom' id='armor-class-tile-value'>{ac}</p>
                {runes.resist.length > 0 && <p className='tile-component label-component' title='Warding Rune'>Resist: {runes.resist.join(', ')}</p>}
            </article>
        </section>
    );
}

export default ArmorClass;