import 'dotenv/config';
import fs from 'fs';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const tables = [
  'species', 'species_features', 'species_affinity_elements', 'sizes',
  'spells', 'spell_upcasts', 'spell_element', 'spell_state', 'spell_alignment', 'spell_bands',
  'armor', 'weapons', 'weapon_category', 'items', 'runes',
  'alignments', 'alignment_bands', 'personality_options',
  'primordial_blessings', 'proficiency_levels', 'features'
];

async function run() {
  fs.mkdirSync('db/content/source', { recursive: true });
  for (const table of tables) {
    const { rows } = await pool.query(`SELECT * FROM ${table}`);
    fs.writeFileSync(`db/content/source/${table}.json`, JSON.stringify(rows, null, 2));
    console.log(`${table}: ${rows.length}`);
  }
  await pool.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });