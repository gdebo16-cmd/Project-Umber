// The 8 ability scores. "key" is the column name in the characters table.
export const STATS = [
    { key: 'str', label: 'Might' },
    { key: 'dex', label: 'Precision' },
    { key: 'con', label: 'Endurance' },
    { key: 'int', label: 'Intellect' },
    { key: 'wis', label: 'Judgment' },
    { key: 'cha', label: 'Confidence' },
    { key: 'spd', label: 'Speed' },
    { key: 'luc', label: 'Luck' },
];

// 'DEX' / 'dex' -> 'Precision' (anything unknown comes back as is)
export const statName = (k) => STATS.find((s) => s.key === String(k ?? '').toLowerCase())?.label ?? k;

// Your house-rule skills: each one adds the modifiers of two stats.
export const SKILLS = [
    { id: 'finesse', name: 'Finesse', stats: ['dex', 'con'] },
    { id: 'memory', name: 'Memory', stats: ['int', 'con'] },
    { id: 'awareness', name: 'Awareness', stats: ['wis', 'spd'] },
    { id: 'knowledge', name: 'Knowledge', stats: ['int', 'cha'] },
    { id: 'faith', name: 'Faith', stats: ['cha', 'luc'] },
    { id: 'arcana', name: 'Arcana', stats: ['int', 'wis'] },
    { id: 'botany', name: 'Botany', stats: ['int', 'dex'] },
    { id: 'triage', name: 'Triage', stats: ['wis', 'dex'] },
    { id: 'diplomacy', name: 'Diplomacy', stats: ['cha', 'spd'] },
    { id: 'misdirection', name: 'Misdirection', stats: ['spd', 'luc'] },
    { id: 'stealth', name: 'Stealth', stats: ['spd', 'con'] },
    { id: 'presence', name: 'Presence', stats: ['str', 'wis'] },
    { id: 'showmanship', name: 'Showmanship', stats: ['cha', 'str'] },
    { id: 'dominance', name: 'Dominance', stats: ['str', 'int'] },
    { id: 'balance', name: 'Balance', stats: ['str', 'dex'] },
];
