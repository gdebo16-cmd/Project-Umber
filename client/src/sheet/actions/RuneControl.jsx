import { useEffect, useState } from 'react';
import { sendJson } from '../../utils/api';
import { useCharacter } from '../CharacterContext';

// "Inscribe runes" control for one owned item (Rune Weaver only). kind = 'weapon' | 'armor'; itemId = catalog id.
// The server enforces item types, prerequisites, per-item and active limits; this only offers the likely picks.
function RuneControl({ kind, itemId, itemType, itemRunes = [], isRunedWeapon = false }) {
    const { character, setOwnedWeapons, setOwnedArmor, onRoll } = useCharacter();
    const base = `/api/characters/${character.id}/runes`;
    const [info, setInfo] = useState(null);
    const [runeId, setRuneId] = useState('');
    const [choice, setChoice] = useState('');

    useEffect(() => {
        let live = true;
        fetch(base).then((r) => r.json()).then((d) => { if (live) setInfo(d); }).catch(() => {});
        return () => { live = false; };
    }, [base]);

    if (!info?.isRuneWeaver) return null;

    const apply = (data) => {
        setInfo(data.runeInfo);
        setOwnedWeapons(data.ownedWeapons);
        setOwnedArmor(data.ownedArmor);
        if (data.endedOldest) onRoll(`Active rune limit reached: your oldest rune (${data.endedOldest}) ended.`);
    };
    const post = async (path, body) => {
        try { apply(await sendJson(`${base}/${path}`, 'POST', body)); } catch (err) { onRoll(err.message); }
    };

    const onItem = new Set(itemRunes.map((r) => Number(r.rune_id)));
    const options = info.runes.filter((r) => r.item_types.includes(itemType) && r.min_level <= info.level && !onItem.has(Number(r.id)));
    const picked = info.runes.find((r) => String(r.id) === runeId);
    const full = itemRunes.length >= info.perItem;

    const inscribe = () => {
        if (!picked) return;
        post('inscribe', { kind, item_id: itemId, rune_id: picked.id, choice_value: choice || undefined });
        setRuneId(''); setChoice('');
    };

    return (
        <>
            <p><strong>Runes</strong> ({itemRunes.length}/{info.perItem} on item, {info.used}/{info.active} active)</p>
            {itemRunes.map((r) => (
                <p key={r.id} title={r.effect}>
                    {r.name}{r.choice_value ? ` (${r.choice_value})` : ''}{' '}
                    <button type="button" className="btn btn-action hover-grow" onClick={() => post('remove', { item_rune_id: r.id })}>Remove</button>
                </p>
            ))}
            {!full && options.length > 0 && (
                <p>
                    <select className="field" aria-label="Rune to inscribe" value={runeId} onChange={(e) => { setRuneId(e.target.value); setChoice(''); }}>
                        <option value="">Inscribe runes...</option>
                        {options.map((r) => <option key={r.id} value={r.id}>{r.name} (L{r.min_level})</option>)}
                    </select>
                    {picked?.choice_param === 'damage_type' && (
                        <select className="field" aria-label="Damage type" value={choice} onChange={(e) => setChoice(e.target.value)}>
                            <option value="">Damage type...</option>
                            {info.wardingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    )}
                    <button type="button" className="btn btn-action hover-grow" disabled={!picked || (picked.choice_param && !choice)} onClick={inscribe}>Inscribe</button>
                </p>
            )}
            {picked && <p>{picked.effect}</p>}
            {kind === 'weapon' && itemRunes.length > 0 && (
                <p>
                    <label>
                        <input type="checkbox" checked={isRunedWeapon} onChange={() => post('runed-weapon', { weapon_id: isRunedWeapon ? null : itemId })} /> Runed weapon (INT, Runic Strike)
                    </label>
                </p>
            )}
        </>
    );
}

export default RuneControl;
