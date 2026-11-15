import { modOf, signed, healthInit, d20 } from '../utils/math';

// Click the box to roll a d20 + initiative
function Initiative({ character, hp, onRoll }) {
    const init = modOf(character.dex) + healthInit(hp, character.max_hp);

    return (
        <section className='container' id='initiative-container'>
            <article className='tile initiative-tile' id='initiative-tile-container' onClick={() => onRoll(`Initiative: ${d20() + init}`)}>
                <p className='tile-component label-component tile-top' id='initiative-tile-label'>Initiative</p>
                <p className='tile-component value-component' id='initiative-tile-value'>{signed(init)}</p>
            </article>
        </section>
    );
}

export default Initiative;
