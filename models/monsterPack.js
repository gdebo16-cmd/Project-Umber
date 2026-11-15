// Spell catalog from db/content/spells.json (built from source/). In-memory Maps; hot-reloads in non-production.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAlignmentBand } from './content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONSTERS_FILE = path.join(__dirname, '..', 'db', 'content', 'content.json');

let monstersById = new Map();
let allMonsters = [];

function rebuild(raw) {
    allMonsters = raw.monsters ?? [];
    monstersById = new Map(allMonsters.map((m) => [Number(m.id), m]));
}

export function loadMonsterPack() {
    const raw = JSON.parse(fs.readFileSync(MONSTERS_FILE, 'utf8'));
    rebuild(raw);
}

loadMonsterPack();

if (process.env.NODE_ENV !== 'production') {
    let timer = null;
    try {
        fs.watch(MONSTERS_FILE, { persistent: false }, () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    loadMonsterPack();
                    console.log('[monsterPack] reloaded', MONSTERS_FILE);
                } catch (err) {
                    console.error('[monsterPack] reload failed:', err.message);
                }
            }, 100);
        });
    } catch (err) {
        console.error('[monsterPack] watch failed:', err.message);
    }
}

export function getMonster(id) {
    if (id == null || id === '') return undefined;
    return monstersById.get(Number(id));
}

export function listMonsters() {
    return allMonsters.map((m) => ({ id: m.id, name: m.name, art_url: m.art_url, size_id: m.size_id }));
    
}

