import { useState } from 'react';

function HealthBox({ id, hp, max, onHpChange }) {
    const [amount, setAmount] = useState('');

    const change = async (action) => {
        const res = await fetch(`/api/characters/${id}/hp`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action,
                amount: Number(amount),
            }),
        });
        if (res.ok) {
            const data = await res.json();
            onHpChange(data.current_hp);
            setAmount('');
        }
    };

    return (
        <section className='container health-container' id='health-container'>
            <article className='tile health-button-tile'>
                <button type='button' id='heal-button' className='tile-component button-tile-component button-component hover-grow' onClick={() => change('heal')}>Heal</button>
                <input type='number' id='hp-input' className='tile-component button-tile-component input-component' min='0' value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button type='button' id='damage-button' className='tile-component button-tile-component button-component hover-grow' onClick={() => change('damage')}>Damage</button>
            </article>
            <article className='tile current-hp-tile'>
                <p className='tile-component label-component hp-label-component' id='current-hp-label'>Current HP</p>
                <p className='tile-component value-component hp-value-component' id={hp === 0 ? 'current-hp-value--fallen' : 'current-hp-value'}>{hp === 0 ? 'You Have Fallen!' : hp}</p>
            </article>
            <article className='tile max-hp-tile'>
                <p className='tile-component label-component hp-label-component' id='max-hp-label'>Max HP</p>
                <p className='tile-component value-component hp-value-component' id='max-hp-value'>{max}</p>
            </article>
            <article className='hp-bar-tile'>
                <div className='tile-component bar-component' id='hp-bar-fill' style={{ width: `${Math.min(100, Math.max(0, max ? (hp / max) * 100 : 0))}%` }}></div>
            </article>
        </section>
    );
}

export default HealthBox;
