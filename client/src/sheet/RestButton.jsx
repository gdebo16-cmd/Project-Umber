import { useState } from 'react';
import { useCharacter } from './CharacterContext';

function RestButton() {
    const { rest, onRoll } = useCharacter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const takeRest = async (type) => {
        setBusy(true);
        const pct = await rest(type);
        setBusy(false);
        setOpen(false);
        onRoll(type === 'long' ? 'Long Rest: fully restored!' : `Short rest: restored ${pct}%`);
    };

    return (
        <section className='rest-container'>
            {!open ? (
                <button type='button' className='rest-button' onClick={() => setOpen(true)}>Rest</button>
            ) : (
                <article className='rest-choice'>
                    <button type='button' className='rest-choice-button' disabled={busy} onClick={() => takeRest('short')}>Short Rest</button>
                    <button type='button' className='rest-choice-button' disabled={busy} onClick={() => takeRest('long')}>Long Rest</button>
                    <button type='button' className='rest-cancel-button' onClick={() => setOpen(false)}>Cancel</button>
                </article>
            )}
        </section>
    );
}

export default RestButton;