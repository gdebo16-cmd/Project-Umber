# Eldridia Interactive VTT Roadmap

**Project:** Project Umber / Eldrid Tales  
**Goal:** Build a first-party Virtual Tabletop that runs Eldridia campaigns end-to-end — characters, campaigns, maps, tokens, and live multiplayer sessions — on top of the existing Express + Postgres stack.

This document is the living product roadmap. Pair it with the [Miro VTT Roadmap board](https://miro.com/app/board/uXjVEe15X-c=/) for the visual timeline.

---

## North star

A GM and players can create Eldridia characters, join a campaign, load a map scene, move tokens together in real time, roll dice, and track combat — without leaving Eldrid Tales.

**Out of scope for v1:** full Foundry-style module marketplace, 3D maps, video conferencing (hooks only), automated rules adjudication for every Eldridia ability.

---

## Current foundation (already in repo)

| Area | Status | Notes |
|------|--------|-------|
| Auth & sessions | Done | Express session auth, login/register/settings |
| Character create | Partial | Race + class draft in session; not fully persisted |
| Home hub | Stubbed | Characters / Campaigns / Settings nav present |
| Campaign flows | Not built | Nav links only (`/create_campaign`, `/campaign_list`, `/premade`) |
| Schema sketch | Draft | `users`, `characters`, `races`, `classes` in `models/eldridDB.sql` |
| Class / race art | Strong | 14 classes, 7 races, 45 subclass thumbs, look bible |
| Map assets | Seeded | `Public/utils/MapBackground.png`, `mapblack1.png` |
| Rules bible | Locked | Eldridia 14 classes, levels 1–30 (index in `Public/utils/md/`) |
| Realtime / VTT canvas | Missing | No WebSocket, map UI, or token sync yet |

Stack today: **Node (ESM) + Express 5 + Postgres + static HTML/CSS**. VTT work should extend this unless a deliberate frontend pivot is approved.

---

## Principles

1. **Campaign-first.** The VTT table is a room owned by a campaign, not a free-floating sandbox.
2. **Characters are first-class.** Tokens bind to saved characters; sheets stay reachable from the table.
3. **Eldridia-native.** Art, stats (incl. LUC/SPD), and class kit feed the table — not generic D&D defaults.
4. **Ship playable slices.** Each phase ends with something a table can *use*, not just infrastructure.
5. **Realtime is intentional.** Add sockets when there is a map worth syncing; not before.

---

## Phased roadmap

### Phase 0 — Product locks (planning)

**Outcome:** Shared decisions so build work does not thrash.

- [ ] Confirm v1 target: browser desktop first; tablet OK; phone = companion later
- [ ] Lock grid default (square vs hex) and unit scale
- [ ] Define GM vs player permissions on the table
- [ ] Choose realtime transport (recommend Socket.IO on same Express app)
- [ ] Decide map asset pipeline (upload + curated library vs curated-only for MVP)
- [ ] Align character schema with full Eldridia sheet (subclass, level, HP, resources)

**Exit:** Short ADR or checklist signed off by Gabriel / Naman.

---

### Phase 1 — Campaign & character backbone

**Outcome:** Players can finish characters and organize into campaigns. No live table yet.

**Build**
- [ ] Complete character creation (stats, subclass, level 1 defaults, persist to `characters`)
- [ ] Character list + sheet view/edit
- [ ] Campaign CRUD: create, list, invite/join code
- [ ] Campaign membership roles: `gm`, `player`
- [ ] Attach characters to a campaign (one active char per player per campaign)
- [ ] Wire home hub lists to real data (current characters / campaigns / unfinished drafts)

**Data additions (sketch)**
```text
campaigns(id, name, description, owner_id, join_code, created_at)
campaign_members(campaign_id, user_id, role)
campaign_characters(campaign_id, character_id, user_id)
character_drafts(...)  -- optional: replace session-only drafts
```

**Exit criteria:** Two accounts can create characters, join one campaign, and see each other listed.

---

### Phase 2 — Solo table (map + tokens)

**Outcome:** A GM can open a campaign scene, place a map, and move tokens locally (single-client).

**Build**
- [ ] `/campaigns/:id/table` VTT shell (canvas + side panels)
- [ ] Pan / zoom map viewport
- [ ] Load campaign map from library (start with existing `MapBackground` assets)
- [ ] Optional square grid overlay + snap
- [ ] Token entities: image, label, position, size, owner, linked `character_id`
- [ ] Drag tokens; GM can move any; players move owned tokens
- [ ] Persist scene state (map + tokens) to Postgres
- [ ] Basic layers: background → grid → tokens → (later drawings/fog)

**Data additions (sketch)**
```text
scenes(id, campaign_id, name, map_asset_url, grid_size, is_active)
tokens(id, scene_id, character_id?, label, image_url, x, y, scale, owner_user_id)
```

**Exit criteria:** GM prepares a scene with party tokens and reloads the page without losing placements.

---

### Phase 3 — Live multiplayer sync

**Outcome:** Everyone at the table sees the same map state in real time.

**Build**
- [ ] Socket room per campaign/scene
- [ ] Sync: token move, token add/remove, scene switch
- [ ] Presence list (who is connected + role)
- [ ] Shared dice roller (formula + result broadcast)
- [ ] Light chat / GM announce channel
- [ ] Conflict rules: last-write or GM authority for contested moves
- [ ] Reconnect + resync snapshot on join

**Exit criteria:** Two browsers in one campaign move tokens and see dice rolls without refresh.

---

### Phase 4 — Play loop (combat & sheet bridge)

**Outcome:** A full session loop: explore → fight → update character state.

**Build**
- [ ] Initiative / turn order tracker (GM-controlled)
- [ ] Token HUD: HP, conditions (manual for v1)
- [ ] Open character sheet drawer from token
- [ ] Push sheet HP/resources ↔ token display
- [ ] Fog of war (GM reveal rectangles or brush)
- [ ] Simple drawings / measure tool
- [ ] Encounter prep: duplicate scene / reset tokens to start
- [ ] Optional: Eldridia quick-ref panel (class ability stubs)

**Exit criteria:** Run a 3–4 encounter one-shot without leaving the table UI.

---

### Phase 5 — Polish & expand

**Outcome:** Production-ready enough for regular Eldridia games.

**Build**
- [ ] Map / token upload + asset library per campaign
- [ ] Premade campaign → seeded scenes (wire `/premade`)
- [ ] Permissions hardening, abuse limits, session store beyond MemoryStore
- [ ] Performance: large maps, many tokens, socket backpressure
- [ ] Mobile companion: sheet + dice + chat (read-focused)
- [ ] Accessibility: keyboard move tokens, contrast, focus order
- [ ] Observability: table join metrics, error logging

**Exit criteria:** Stable weekly game for a real party; known issues documented.

---

## Suggested build order (first milestones)

| Milestone | Delivers | Depends on |
|-----------|----------|------------|
| M1 | Finish + save character sheets | Phase 1 |
| M2 | Campaign create/join + roster | M1 |
| M3 | Solo map + token persistence | M2 |
| M4 | Socket sync + dice | M3 |
| M5 | Initiative + fog + sheet bridge | M4 |

Do not start M3 until M2 membership and character attachment are solid — orphan tokens are expensive to migrate.

---

## Technical sketch

```text
Browser
  ├─ Static / EJS pages (hub, sheets, campaigns)   [exists]
  └─ VTT client (canvas module + socket client)    [new]

Express app
  ├─ REST: auth, characters, campaigns, scenes    [extend]
  └─ Socket.IO: table sync, dice, presence        [new]

Postgres
  ├─ users / races / classes / characters         [partial]
  └─ campaigns / members / scenes / tokens        [new]
```

**Canvas approach (recommendation):** start with HTML Canvas or a thin PixiJS layer for pan/zoom/tokens. Avoid a full game engine until Phase 4 proves need.

**Auth for sockets:** reuse session cookie; reject joins if user is not a campaign member.

---

## Risks & open questions

| Risk / question | Impact | Mitigation |
|-----------------|--------|------------|
| Character create incomplete | Blocks campaign play | Finish Phase 1 before any table UI |
| MemoryStore sessions | Breaks multi-instance / restarts | Move to Postgres/Redis session store before Phase 3 |
| Map IP / uploads | Legal + storage cost | Curated maps first; uploads behind GM role |
| Scope creep toward Foundry | Slows MVP | Cap v1 at list in North star |
| Hex vs square undecided | Rework grid/snap | Lock in Phase 0 |
| Full 1–30 rules automation | Huge | Manual HP/conditions in v1; helpers later |

---

## How to use this roadmap

1. Pick the next unchecked item in the **lowest incomplete phase**.
2. Open a focused PR (one milestone slice).
3. Update checkboxes here when merged.
4. Mirror status on the Miro timeline (Done / Now / Next / Later).

---

## Appendix — UI entry points already hinted in nav

From `Public/home.html`:

- `/create_char`, `/char_list`
- `/create_campaign`, `/campaign_list`, `/premade`
- `/profile`, `/settings`

Recommended new routes:

- `/campaigns/:id` — campaign hub
- `/campaigns/:id/table` — live VTT
- `/characters/:id` — sheet

---

*Started 2026-10-04. Update as phases complete.*
