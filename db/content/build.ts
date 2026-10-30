import fs from 'fs';
import type { Role, RoleRules, FeatureRule, FeatureData, ScalingRule, RoleInfo } from './type.js';

const roles: Role[] = JSON.parse(fs.readFileSync('db/seedData/classes.json', 'utf8'));
const rules: { scaling_rules: ScalingRule[]; roles: RoleRules[] } =
  JSON.parse(fs.readFileSync('db/seedData/feature_rules.json', 'utf8'));
const rolesInfo: RoleInfo[] = JSON.parse(fs.readFileSync('db/content/roles_info.json', 'utf8'));

const missing: string[] = [];
const missingInfo: string[] = [];
const missingCallings: string[] = [];

const infoByName = new Map(rolesInfo.map((r) => [r.name, r]));

// Find the rule for a feature by name and level
function findRule(list: FeatureRule[], name: string, level: number) {
  return list.find(f => f.name === name && f.level === level);
}

// Hoist create-time choice fields onto the pack feature (Rewrite Fate etc. stay inside data only)
function createChoiceFields(rule: FeatureRule | undefined) {
  const d = rule?.data as FeatureData | undefined;
  if (!d || d.choice_timing !== 'create' || !Array.isArray(d.options) || d.options.length === 0) {
    return {};
  }
  const out: { options: string[]; choice_count: number; option_info?: Record<string, string> } = {
    options: d.options,
    choice_count: typeof d.choice_count === 'number' ? d.choice_count : 1,
  };
  if (d.option_info && typeof d.option_info === 'object') out.option_info = d.option_info;
  return out;
}


// Placeholders: these mark a slot in the schedule, not a real ability
const MARKERS: Record<string, string> = {
    'Choose Subclass': 'choose_calling',
    'Subclass Feature': 'calling_feature',
    'Divine Blessing': 'divine_blessing'
  };

const output = roles.map(role => {
  const roleRules = rules.roles.find(r => r.name === role.name);
  const ruleList = roleRules?.features ?? [];
  const info = infoByName.get(role.name);
  if (!info) missingInfo.push(role.name);

  return {
    id: info?.id ?? null,
    key: info?.key ?? null,
    name: role.name,
    hit_die: info?.hit_die ?? role.hit_die,
    primary_stat: info?.primary_stat ?? role.primary_stat,
    description: info?.description ?? null,
    sort_order: info?.sort_order ?? null,
    armor_prof: info?.armor_prof ?? null,
    weapon_prof: info?.weapon_prof ?? null,
    tool_prof: info?.tool_prof ?? null,
    skill_count: info?.skill_count ?? null,
    skill_options: info?.skill_options ?? [],
    skill_fixed: info?.skill_fixed ?? [],
    spell_stat: info?.spell_stat ?? null,
    spellcasting: info?.spellcasting ?? null,
    caster_type: info?.caster_type ?? null,
    img_url: info?.img_url ?? null,
    levels: role.levels.map(lvl => ({
      level: lvl.level,
      proficiency: lvl.proficiency,
      features: lvl.features.map(name => {
        if (MARKERS[name]) return { name, marker: MARKERS[name] };
        const rule = findRule(ruleList, name, lvl.level);
        if (!rule) missing.push(`${role.name} L${lvl.level}: ${name}`);
        return { name, description: rule?.description ?? '', data: rule?.data ?? null, ...createChoiceFields(rule) };
      })
    })),
    callings: role.callings.map(c => {
      const cRules = roleRules?.callings?.find(x => x.name === c.name)?.features ?? [];
      const cInfo = info?.callings?.find(x => x.name === c.name);
      if (info && !cInfo) missingCallings.push(`${role.name} / ${c.name}`);
      return {
        id: cInfo?.id ?? null,
        key: cInfo?.key ?? null,
        name: c.name,
        description: cInfo?.description ?? null,
        img_url: cInfo?.img_url ?? null,
        armor_prof: cInfo?.armor_prof ?? null,
        weapon_prof: cInfo?.weapon_prof ?? null,
        tool_prof: cInfo?.tool_prof ?? null,
        sort_order: cInfo?.sort_order ?? null,
        features: c.features.map(f => {
          const rule = findRule(cRules, f.name, f.level);
          if (!rule) missing.push(`${role.name} / ${c.name} L${f.level}: ${f.name}`);
          return { ...f, description: rule?.description ?? '', data: rule?.data ?? null, ...createChoiceFields(rule) };
        })
      };
    })
  };
});

// Load every exported content file from db/content/source
const sourceDir = 'db/content/source';
const catalogs: Record<string, unknown[]> = {};
for (const file of fs.readdirSync(sourceDir)) {
  if (!file.endsWith('.json')) continue;
  const name = file.replace('.json', '');
  catalogs[name] = JSON.parse(fs.readFileSync(`${sourceDir}/${file}`, 'utf8'));
}

// Swap species ID numbers for readable words
type Row = Record<string, any>;
const byId = (list: Row[]) => new Map(list.map(r => [r.id, r]));

const sizes = byId(catalogs.sizes as Row[]);
const features = byId(catalogs.features as Row[]);
const states = byId(catalogs.spell_state as Row[]);
const allSpells = byId(catalogs.spells as Row[]);

catalogs.species = (catalogs.species as Row[]).map(s => ({
  ...s,
  size: sizes.get(s.size_id)?.name ?? null,
  signature_state: states.get(s.signature_state_id)?.name ?? null,
  race_spell: allSpells.get(s.race_spell_id)?.name ?? null,
  traits: (catalogs.species_features as Row[])
    .filter(sf => sf.species_id === s.id)
    .map(sf => ({
      name: features.get(sf.feature_id)?.name ?? 'Unknown',
      description: sf.description ?? features.get(sf.feature_id)?.description ?? ''
    }))
}));

// Only needed for the swap above, so leave them out of the pack
delete catalogs.features;
delete catalogs.species_features;

fs.mkdirSync('db/content', { recursive: true });

// Spell-related sections go in their own file
const SPELL_KEYS = ['spells', 'spell_upcasts', 'spell_element', 'spell_state', 'spell_alignment', 'spell_bands'];

const core: Record<string, unknown> = { scaling_rules: rules.scaling_rules, roles: output };
const spellPack: Record<string, unknown> = {};

for (const [name, rows] of Object.entries(catalogs)) {
  if (SPELL_KEYS.includes(name)) spellPack[name] = rows;
  else core[name] = rows;
}

fs.writeFileSync('db/content/content.json', JSON.stringify(core, null, 2));
fs.writeFileSync('db/content/spells.json', JSON.stringify(spellPack, null, 2));

console.log(`Wrote db/content/content.json with ${output.length} roles`);
console.log(`Features with no rules: ${missing.length}`);
missing.slice(0, 30).forEach(m => console.log('  ' + m));
console.log(`Roles missing from roles_info.json: ${missingInfo.length}`);
missingInfo.forEach(m => console.log('  ' + m));
console.log(`Callings missing from roles_info.json: ${missingCallings.length}`);
missingCallings.forEach(m => console.log('  ' + m));