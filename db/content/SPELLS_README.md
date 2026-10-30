# Editing spells (JSON pack)

Spells no longer need a database edit for the catalog. The live server reads `db/content/spells.json` into memory.

## Edit or add a spell

1. Open `db/content/source/spells.json` (and `spell_upcasts.json` if the spell has higher-level versions).
2. Keep existing `id` numbers stable. New spells need a new unused `id`.
3. Set `state_id`, `element_id`, and `alignment_id` using the ids in `spell_state.json`, `spell_element.json`, and `spell_alignment.json`.
4. Rebuild the pack from the project root:

```
npx tsx db/content/build.ts
```

5. In development the server hot-reloads `db/content/spells.json` automatically. If it does not pick up the change, restart Express.

## Role bonus grants (feature spells)

Bonus spells (for example Soul Link on Reaver) live in `db/content/source/role_bonus_spells.json`:

- `role_id`, `calling_id` (or null), `spell_id`, `min_level`

Run the same build command after editing. Feature-only names that must not appear in the learn list stay in code as `FEATURE_ONLY_SPELL_NAMES` in `models/spellModel.js` (Grace Bolt, Soul Link).

## What still uses the database

- `character_spells` — which spells each character learned / prepared
- `role_spell_slots` — how many slots a class gets (not in the pack yet)

## Do not

- Renumber old spell ids (characters and items store those numbers)
- Edit only `db/content/spells.json` by hand if you also use `source/` — always edit source, then build