import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function load(file) {
  const text = fs.readFileSync(path.join(__dirname, '..', 'db', 'content', file), 'utf8');
  const version = crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
  return { text, version };
}

const core = load('content.json');
const spells = load('spells.json');

function send(pack) {
  return (req, res) => {
    res.set('ETag', pack.version);
    if (req.headers['if-none-match'] === pack.version) return res.status(304).end();
    res.type('json').send(pack.text);
  };
}

export const getContent = send(core);
export const getSpells = send(spells);