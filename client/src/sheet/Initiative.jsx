import { modOf, signed, healthInit, d20 } from '../utils/math';

// Click the box to roll a d20 + initiative
function Initiative({ character, hp, onRoll }) {
    const init = modOf(character.dex) + healthInit(hp, character.max_hp);

    return (
        <section className='initiative'>
            <article id='initContainer' className='initContainer' onClick={() => onRoll(`Initiative: ${d20() + init}`)}>
                <h2 id='initTitle' className='cap-top'>Initiative</h2>
                <p id='initValue'>{signed(init)}</p>
            </article>
        </section>
    );
}

export default Initiative;
