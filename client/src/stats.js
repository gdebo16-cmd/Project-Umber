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
    { id: 'acrobatics', name: 'Acrobatics', stats: ['spd', 'dex'] },
    { id: 'animalHandling', name: 'Animal Handling', stats: ['wis', 'cha'] },
    { id: 'arcana', name: 'Arcana', stats: ['int', 'wis'] },
    { id: 'athletics', name: 'Athletics', stats: ['str', 'dex'] },
    { id: 'deception', name: 'Deception', stats: ['cha', 'luc'] },
    { id: 'history', name: 'History', stats: ['int', 'wis'] },
    { id: 'insight', name: 'Insight', stats: ['int', 'spd'] },
    { id: 'intimidation', name: 'Intimidation', stats: ['con', 'luc'] },
    { id: 'investigation', name: 'Investigation', stats: ['int', 'con'] },
    { id: 'medicine', name: 'Medicine', stats: ['wis', 'spd'] },
    { id: 'nature', name: 'Nature', stats: ['con', 'wis'] },
    { id: 'perception', name: 'Perception', stats: ['spd', 'cha'] },
    { id: 'performance', name: 'Performance', stats: ['cha', 'luc'] },
    { id: 'persuasion', name: 'Persuasion', stats: ['cha', 'dex'] },
    { id: 'religion', name: 'Religion', stats: ['cha', 'int'] },
    { id: 'sleightOfHand', name: 'Sleight of Hand', stats: ['dex', 'spd'] },
    { id: 'stealth', name: 'Stealth', stats: ['luc', 'spd'] },
    { id: 'survival', name: 'Survival', stats: ['str', 'con'] },
];
