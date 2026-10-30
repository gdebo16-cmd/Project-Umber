# Content Guide (beginner)

Umber keeps **rulebook / static catalogs** in a JSON content pack on disk, and **per-user / per-character data** in the Neon Postgres database. Runtime code reads catalogs from the pack (pack wins). Database foreign keys from player tables to those catalogs have been dropped (soft refs): the integer/text ids stay the same, but Postgres no longer enforces that the catalog row exists.

Static catalog **tables may still exist** in the DB for now. Do **not** drop them until a later migration is approved. Do not rely on them for app reads.

## What lives where

### Content pack (edit these to change the game rules)

| Kind | Source (edit) | Built into |
|------|----------------|------------|
| Roles, callings, levels, features (authored) | `db/content/roles_info.json` | `db/content/content.json` → `roles` |
| Species (races / lineages) | `db/content/source/species.json` (+ related) | `content.json` → `species` |
| Spells + spell_state / element / alignment | `db/content/source/spells*.json` (and related) | `db/content/spells.json` + slices in `content.json` |
| Role spell slots | `db/content/source/role_spell_slots.json` | `spells.json` / pack |
| Items, armor, weapons, weapon_category | `db/content/source/*.json` | `content.json` |
| Alignments, alignment_bands, personality_options, sizes | source JSON | `content.json` |
| Features junctions: role_features, calling_features, species_features | source JSON | `content.json` |
| Role item proficiencies, class_feature_options | source JSON | `content.json` |
| Runes, primordial_blessings, proficiency_levels, scaling_rules | source JSON | `content.json` |
| Legacy bridges (races/subraces/classes/sub_classes) | `db/content/source/legacy_*.json` | `content.json` → `legacy_*` |

Build output (do not hand-edit unless you know why):

- `db/content/content.json`
- `db/content/spells.json`

Hot-reload: models that load the pack (for example `models/content.js`, `models/spellPack.js`) re-read when the built files change after a rebuild + server restart (or whatever reload path you already use locally).

### Database (player data only for app purposes)

Keep in Postgres and treat as the source of truth for play:

- `users`, `session`
- `characters` and character children: `character_spells`, `character_armor`, `character_weapons`, `character_items`, `item_runes`
- `campaigns`, `campaign_members`

Columns on `characters` such as `species_id`, `role_id`, `calling_id`, `alignment_code`, `*_id` for personality, and owned gear `armor_id` / `weapon_id` / `item_id` / `rune_id` are **soft references**: they store stable ids that must match the pack, but there is no FK to the catalog tables anymore.

### Still in DB but static (do not drop yet)

Catalog tables such as `species`, `roles`, `callings`, `spells`, `items`, `armor`, `weapons`, `runes`, `features`, junctions, legacy `races` / `classes`, etc. may still be present. App readers should not depend on them. A future migration will drop them after a bake period.

## How to edit or add content (keep ids stable)

1. **Prefer editing source JSON under `db/content/`** (especially `roles_info.json` and `db/content/source/*.json`), not the built `content.json` / `spells.json`.
2. **Keep existing ids and keys stable.** Player rows and soft refs point at these numbers/strings. Renaming a display `name` is usually fine; changing `id`, `key`, or reusing an id for a different entity is not.
3. **Adding new content:** assign a **new unused id** (and a unique `key` where the schema uses keys). Do not renumber old rows to “make room.”
4. **Removing content:** do not delete an id that any character still references. Prefer retiring (leave the row, stop offering it in UI) until you have cleaned player data.
5. **Spells:** add/change spell rows in the spell source; rebuild so `spells.json` updates. Character learned spells store `spell_id` only.
6. **Roles / callings / features:** edit `roles_info.json` (and feature junction exports if you maintain those separately), then rebuild. Feature choice keys use scheme A: `class:<roleKey>:<featureName>:<level>` (and `subclass:...`).
7. **Items / armor / weapons / runes:** edit the matching source files; owned inventory rows keep catalog ids.

After edits, always rebuild (next section) and spot-check locally before committing.

## Build command

From the project root (`Project-Umber`):

```bash
npx tsx db/content/build.ts
```

That writes `db/content/content.json` and `db/content/spells.json`. Commit the source files **and** the built JSON if your deploy expects them in the repo (Render builds from `main` as you currently do).

## Test locally

1. Use the **sandbox** Neon database only for structural experiments (`DATABASE_URL` from your sandbox / temp restructure URL). Do not point local experiments at production.
2. Rebuild the pack (`npx tsx db/content/build.ts`).
3. Start the API: `npm start` or `npm run devStart` (nodemon), with Vite client on `:5173` if you use the React UI.
4. Smoke-check:
   - Character create (races / roles / gear / magic steps)
   - Sheet (names, HP, proficiencies, actions)
   - Spells (learn / prepare / slots)
   - Inventory (catalog + owned gear)
   - Editor (race/role/abilities)
   - Level-up
5. If you changed soft-ref behavior or added a SQL migration under `db/restructure/`, **dry-run then apply on sandbox only** before any prod discussion.

## Deploy (commit + push to `main` → Render)

When Gabriel asks to ship:

1. Confirm sandbox verification passed.
2. Commit on the working branch (usually `dev`), then merge / push to **`main`** as you normally do for Render.
3. Render redeploys from `main`. Pack files in the repo are what production serves for catalogs.
4. **Do not** push unsolicited. No commit/push unless asked.

## When a DB migration is still needed

You need a numbered SQL migration under `db/restructure/` (dry-run + apply on sandbox first) when:

- Dropping or adding **columns** on player tables (`characters`, inventory, etc.)
- Changing **constraints** (for example soft-ref FK drops — already done through `15_static_pack_soft_refs.sql` on sandbox)
- Backfilling or remapping **player** ids
- Eventually **dropping** static catalog tables (not done yet — wait for an explicit go-ahead)

You do **not** need a DB migration when you only change pack JSON (new spell text, new item, tweak a feature description) as long as ids stay stable and no player schema changes.

### Relevant soft-ref migrations (sandbox)

- `14_spells_soft_refs.sql` — FKs to `spells`
- `15_static_pack_soft_refs.sql` — FKs from player tables to species/roles/callings/items/armor/weapons/runes/alignments/personality/legacy ids, etc.

Static tables themselves are intentionally still present after 15.

## Quick checklist for a content change

1. Edit source JSON; keep ids stable.
2. `npx tsx db/content/build.ts`
3. Restart local API; click through create / sheet / spells / inventory / editor / level-up.
4. Commit source + built pack when ready; push to `main` only when asked to deploy.
5. Add a `db/restructure/NN_*.sql` migration only if player schema or constraints must change.