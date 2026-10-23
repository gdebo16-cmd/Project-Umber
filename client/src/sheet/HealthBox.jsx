import { useState } from 'react';

function HealthBox({ id, hp, max, temp = 0, onHpChange, onTempChange }) {
    const [amount, setAmount] = useState('');

    const change = async (action) => {
        const isTemp = action === 'temp'; // temporary HP: doesn't stack, the higher amount stays
        const res = await fetch(`/api/characters/${id}/${isTemp ? 'temp-hp' : 'hp'}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(isTemp ? { amount: Number(amount) } : {
                action,
                amount: Number(amount),
            }),
        });
        if (res.ok) {
            const data = await res.json();
            if (!isTemp) onHpChange(data.current_hp);
            if (data.temp_hp !== undefined && onTempChange) onTempChange(data.temp_hp);
            setAmount('');
        }
    };

    return (
        <section className={`health-container ${hp <= max / 4 ? 'very_hurt' : hp <= max / 2 ? 'hurt' : ''}` } id='health-container'>
            <article className='health-button-tile'>
                <button type='button' id='heal-button' className='tile-component button-tile-component button-component hover-grow' onClick={() => change('heal')}>Heal</button>
                <button type='button' id='temp-hp-button' className='tile-component button-tile-component button-component hover-grow' onClick={() => change('temp')}>Temp HP</button>
                <input type='number' id='hp-input' className='tile-component button-tile-component input-component' min='0' value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button type='button' id='damage-button' className='tile-component button-tile-component button-component hover-grow' onClick={() => change('damage')}>Damage</button>
            </article>
            <article className='current-hp-tile'>
                <p className='tile-component label-component hp-label-component' id='current-hp-label'>Current HP</p>
                <p className='tile-component value-component hp-value-component' id={hp === 0 ? 'current-hp-value--fallen' : 'current-hp-value'}>{hp === 0 ? 'You Have Fallen!' : hp}{temp > 0 ? ` (+${temp} temp)` : ''}</p>
            </article>
            <article className='max-hp-tile'>
                <p className='tile-component label-component hp-label-component' id='max-hp-label'>Max HP</p>
                <p className='tile-component value-component hp-value-component' id='max-hp-value'>{max}</p>
            </article>
            <article className='hp-bar-tile'>
                <div className={`tile-component bar-component ${hp <= max / 4 ? 'very_hurt' : hp <= max / 2 ? 'hurt' : ''}` } id='hp-bar-fill' style={{ width: `${Math.min(100, Math.max(0, max ? (hp / max) * 100 : 0))}%` }}>
                </div>
            </article>
        </section>
    );
}

export default HealthBox;
