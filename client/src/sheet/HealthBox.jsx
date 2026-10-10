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
        <section className='health'>
            <article id='hpButtonContainer'>
                <button type='button' id='healButton' className='hover-grow' onClick={() => change('heal')}>Heal</button>
                <input type='number' id='hpInput' min='0' value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button type='button' id='damageButton' className='hover-grow' onClick={() => change('damage')}>Damage</button>
            </article>
            <article id='HpLabelContainer' className='hpCol'>
                <p id='currHpTitle' className='hpLabel'>Current HP</p>
                <p className={`hpNum${hp === 0 ? ' hpNum--fallen' : ''}`} id='currHpValue'>{hp === 0 ? 'You Have Fallen!' : hp}</p>
            </article>
            <article id='HpValueContainer' className='hpCol'>
                <p id='maxHpTitle' className='hpLabel'>Max HP</p>
                <p className='hpNum' id='maxHpValue'>{max}</p>
            </article>
            <article className='hp-bar'>
                <div className='hp-fill' style={{ width: `${Math.min(100, Math.max(0, max ? (hp / max) * 100 : 0))}%` }}>
            </div>
            </article>
                

        </section>
    );
}

export default HealthBox;
