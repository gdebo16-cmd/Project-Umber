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
        <section className='container rest-container'>
            {!open ? (
                <button type='button' className='btn-action btn-rest' onClick={() => setOpen(true)}>Rest</button>
            ) : (
                <article className='rest-choice'>
                    <button type='button' className='btn-action btn-rest-choice' disabled={busy} onClick={() => takeRest('short')}>Short Rest</button>
                    <button type='button' className='btn-action btn-rest-choice' disabled={busy} onClick={() => takeRest('long')}>Long Rest</button>
                    <button type='button' className='btn-action btn-rest-choice' onClick={() => setOpen(false)}>Cancel</button>
                </article>
            )}
        </section>
    );
}

export default RestButton;