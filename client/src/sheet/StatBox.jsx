import { modOf, signed, d20, capitalize } from '../utils/math';

// Click a box to roll a d20 + that stat's modifier
function StatBox({ label, score, onRoll }) {
    const roll = () => onRoll(`${capitalize(label)} roll: ${d20() + modOf(score)}`);

    return (
        <article className='stat-tile tile hover-grow' onClick={roll}>
            <p className='tile-component label-component tile-top stat-tile-label'>{label}</p>
            <p className='tile-component modifier-component stat-tile-modifier'>{signed(modOf(score))}</p>
            <p className='tile-component value-component tile-bottom stat-tile-value'>{score}</p>
        </article>
    );
}

export default StatBox;
