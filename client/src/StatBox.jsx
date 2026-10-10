import { modOf, signed, d20, capitalize } from './math';

// Click a box to roll a d20 + that stat's modifier
function StatBox({ label, score, onRoll }) {
    const roll = () => onRoll(`${capitalize(label)} roll: ${d20() + modOf(score)}`);

    return (
        <article className='base-stats-box hover-grow' onClick={roll}>
            <p className='stat-name cap-top'>{label}</p>
            <p className='modifier'>{signed(modOf(score))}</p>
            <p className='stat-count cap-bottom'>{score}</p>
        </article>
    );
}

export default StatBox;
