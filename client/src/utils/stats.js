// The 8 ability scores. "key" is the column name in the characters table.
export const STATS = [
    { key: 'str', label: 'Strength' },
    { key: 'dex', label: 'Dexterity' },
    { key: 'con', label: 'Constitution' },
    { key: 'int', label: 'Intelligence' },
    { key: 'wis', label: 'Wisdom' },
    { key: 'cha', label: 'Charisma' },
    { key: 'spd', label: 'Speed' },
    { key: 'luc', label: 'Luck' },
];

// Your house-rule skills: each one adds the modifiers of two stats.
export const SKILLS = [
    { id: 'acrobatics', name: 'Tumbling', stats: ['spd', 'dex'] },
    { id: 'animalHandling', name: 'Beastcraft', stats: ['wis', 'cha'] },
    { id: 'arcana', name: 'Spellcraft', stats: ['int', 'wis'] },
    { id: 'athletics', name: 'Might', stats: ['str', 'dex'] },
    { id: 'deception', name: 'Guile', stats: ['cha', 'luc'] },
    { id: 'history', name: 'Lore of Ages', stats: ['int', 'wis'] },
    { id: 'insight', name: 'Reading People', stats: ['int', 'spd'] },
    { id: 'intimidation', name: 'Menace', stats: ['con', 'luc'] },
    { id: 'investigation', name: 'Searching', stats: ['int', 'con'] },
    { id: 'medicine', name: 'Mending', stats: ['wis', 'spd'] },
    { id: 'nature', name: 'Wildlore', stats: ['con', 'wis'] },
    { id: 'perception', name: 'Watchfulness', stats: ['spd', 'cha'] },
    { id: 'performance', name: 'Showcraft', stats: ['cha', 'luc'] },
    { id: 'persuasion', name: 'Parley', stats: ['cha', 'dex'] },
    { id: 'religion', name: 'Faiths', stats: ['cha', 'int'] },
    { id: 'sleightOfHand', name: 'Quick Hands', stats: ['dex', 'spd'] },
    { id: 'stealth', name: 'Shadowing', stats: ['luc', 'spd'] },
    { id: 'survival', name: 'Wayfinding', stats: ['str', 'con'] },
];
