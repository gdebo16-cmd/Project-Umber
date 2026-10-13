# Project-Umber className / id chart

Generated 10/13/2026, 11:45:38 AM from `client/src` (read-only scan). Line numbers point to the opening tag. Rows are in source order (roughly render order).

**Totals:** 39 JSX files, 559 tagged elements, 144 distinct classes, 190 distinct ids. CSS defines 109 classes / 77 ids across 6 files.

## Contents
- [App root](#app-root)
- [Components](#components)
- [Pages](#pages)
- [Edit pages](#edit-pages)
- [Sheet](#sheet)
- [Selector check](#selector-check)

## Pages

### pages/CreateDescription.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 5 | `section` | `descContainer` | `tile` |  |
| 7 | `article` | `descArticle` |  |  |
| 8 | `section` | `ImgSection` |  |  |
| 9 | `img` | `descImg` | `topTile` | alt=item.name |
| 11 | `section` | `titleSection` |  |  |
| 12 | `h3` | `title` | `bottomTile` |  |
| 15 | `section` | `textSection` |  |  |
| 16 | `p` | `text` | `bottomTile` |  |
| 19 | `section` | `TraitsSection` |  |  |
| 28 | `section` | `classInfoSection` |  |  |
| 38 | `section` | `treeSection` |  |  |

### pages/CreateStep1.jsx

**CSS:** `../styles/char_create.css?inline (as createCss)`, `usePageStyle(createCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 36 | `header` | `topContainer` |  |  |
| 37 | `h1` | `siteTitle` |  | "Create Character" |
| 38 | `h2` | `formTitle` |  | "Step 1 of 3 — Name and race" |
| 42 | `section` | `formContainer` |  |  |
| 43 | `form` |  | `formContainer` |  |
| 44 | `article` | `charNameContainer` | `formSectionContainer tile` |  |
| 45 | `label` |  | `topTile` | "Character name"; htmlFor=name |
| 46 | `input` | `name` | `bottomTile` | type=text; placeholder=One with no name |
| 48 | `article` | `raceSelectContainer` | `formSectionContainer tile` |  |
| 49 | `label` |  | `topTile` | "Race"; htmlFor=race_id |
| 50 | `select` | `race_id` | `bottomTile` |  |
| 58 | `article` | `buttonContainer` | `formSectionContainer` |  |
| 59 | `button` | `submit` |  | "Next: Class"; type=submit |
| 66 | `Link` | `homeLink` |  | "Home"; to=/home |

### pages/CreateStep2.jsx

**CSS:** `../styles/char_create.css?inline (as createCss)`, `usePageStyle(createCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 90 | `header` | `topContainer` |  |  |
| 91 | `h1` | `siteTitle` |  | "Create Character" |
| 92 | `h2` | `formTitle` |  | "Step 2 of 3 — Class and Subclass" |
| 96 | `section` | `formContainer` |  |  |
| 97 | `form` |  | `formContainer` |  |
| 98 | `article` | `classContainer` | `formSectionContainer tile` |  |
| 99 | `label` |  | `topTile` | "Select Class"; htmlFor=class_id |
| 100 | `select` | `class_id` | `bottomTile` |  |
| 108 | `article` | `subClassContainer` | `formSectionContainer tile` |  |
| 109 | `label` |  | `topTile` | "Select Subclass"; htmlFor=subclass_id |
| 110 | `select` | `subclass_id` | `bottomTile` |  |
| 125 | `article` | `buttonContainer` | `formSectionContainer` |  |
| 126 | `button` | `submit` |  | "Next: Abilities"; type=submit |
| 133 | `Link` | `homeLink` |  | "Cancel"; to=/home |

### pages/CreateStep3.jsx

**CSS:** `../styles/char_create.css?inline (as createCss)`, `usePageStyle(createCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 45 | `select` | dynamic: `id` | `bottomTile` |  |
| 55 | `header` | `topContainer` |  |  |
| 56 | `h1` | `siteTitle` |  | "Create Character" |
| 57 | `h2` | `formTitle` |  | "Step 3 of 3 — Abilities" |
| 60 | `section` | `section3Title` |  |  |
| 63 | `section` | `formContainerStep3` |  |  |
| 64 | `form` |  | `formContainer` |  |
| 65 | `article` | `plus2Container` | `formSectionContainer tile` |  |
| 66 | `label` |  | `topTile` | "+2 bonus"; htmlFor=plus2 |
| 70 | `article` | `plus1Container` | `formSectionContainer tile` |  |
| 71 | `label` |  | `topTile` | "+1 bonus"; htmlFor=plus1 |
| 75 | `article` | `baseStatContainer` | `formSectionContainer` |  |
| 77 | `article` | `baseStatItemContainer` | `formSectionContainer tile` |  |
| 78 | `span` |  | `topTile` |  |
| 79 | `button` | `rollBtn` | `bottomTile rollBtn` | type=button; click: () => roll(s.key) |
| 94 | `article` | `buttonContainer` | `formSectionContainer` |  |
| 95 | `button` | `submit` | `formButton` | "Create Character"; type=submit |
| 101 | `Link` | `homeLink` |  | "Cancel"; to=/home |

### pages/EditCharacterPage.jsx

**CSS:** `../styles/charSheet.css?inline (as sheetCss)`, `usePageStyle(sheetCss, 'subpage')`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 37 | `h1` | `editTitle` |  |  |
| 38 | `p` | `editLink` |  |  |
| 40 | `main` |  | `subpage-main` |  |
| 41 | `section` |  | `panel-shell` |  |
| 44 | `article` | `edit-panel-name` | `edit-panel` |  |
| 45 | `h2` |  | `action-tab-title` | "Name and Race" |
| 49 | `article` | `edit-panel-class` | `edit-panel` |  |
| 50 | `h2` |  | `action-tab-title` | "Class and Subclass" |
| 54 | `article` | `edit-panel-abilities` | `edit-panel` |  |
| 55 | `h2` |  | `action-tab-title` | "Abilities" |
| 59 | `article` | `edit-panel-level` | `edit-panel` |  |
| 60 | `h2` |  | `action-tab-title` | "Character Level" |

### pages/HomePage.jsx

**CSS:** `../styles/home.css?inline (as homeCss)`, `usePageStyle(homeCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 39 | `header` | `topContainer` |  |  |
| 40 | `h1` | `siteTitle` |  | "Welcome" |
| 45 | `section` | `current-character-container` | `container` |  |
| 46 | `article` | `current-character-title` | `title` |  |
| 47 | `h2` |  | `title-text` | "Current Characters" |
| 49 | `article` | `current-character-tile` | `tile` |  |
| 53 | `ul` | `current-character-list` | `tile-list` |  |
| 55 | `li` | dynamic: ``character-tile-${ch.id}`` | `character-tile` |  |
| 56 | `Link` |  | `char-tile` | to=`/characters/${ch.id}` |
| 57 | `h3` |  | `character-name` |  |
| 58 | `img` |  | `character-image` | alt=Character Image |
| 59 | `p` |  | `character-race` | "Race:" |
| 60 | `p` |  | `character-class` | "Class:" |
| 61 | `p` |  | `character-subclass` | "Sub-class:" |
| 62 | `button` |  | `character-delete-button` | "Delete"; type=button; click: (e) => deleteCharacter(e, ch) |
| 70 | `section` | `current-campaign-container` | `container` |  |
| 71 | `article` | `current-campaign-title` | `title` |  |
| 72 | `h2` |  | `title-text` | "Current Campaigns" |
| 74 | `article` | `current-campaign-list` | `tile` |  |
| 75 | `p` |  | `tile-text` | "No Campaigns Planned" |
| 78 | `section` | `unfinished-character-container` | `container` |  |
| 79 | `article` | `unfinished-character-title` | `title` |  |
| 80 | `h2` |  | `title-text` | "Unfinished Work" |
| 82 | `article` | `unfinished-character-list` | `tile` |  |
| 83 | `ul` | `unfinished-character-list` | `tile-list` |  |
| 85 | `li` | dynamic: ``character-tile-${draft.id}`` | `character-tile` |  |
| 86 | `Link` |  | `char-tile` | to=draft.subclass_id ? '/create_c |
| 87 | `h3` |  | `character-name` |  |
| 88 | `img` |  | `character-image` | alt=Character Image |
| 89 | `p` |  | `character-race` | "Race:" |
| 90 | `p` |  | `character-class` | "Class:" |
| 91 | `p` |  | `character-subclass` | "Sub-class:" |
| 92 | `button` |  | `character-delete-button` | "Delete"; type=button; click: deleteDraft |
| 96 | `p` |  | `tile-text` | "You are all caught up!" |
| 103 | `p` | `footerText` |  | "copyrite Eldrid Tales LLC" |

### pages/InventoryPage.jsx

**CSS:** `../styles/charSheet.css?inline (as sheetCss)`, `usePageStyle(sheetCss, 'subpage')`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 16 | `h1` | `inventory-title` |  | "Inventory" |
| 17 | `p` | `inventory-link` |  |  |
| 19 | `main` |  | `subpage-main` |  |

### pages/LoginPage.jsx

**CSS:** `../styles/signin.css?inline (as signinCss)`, `usePageStyle(signinCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 27 | `header` | `topContainer` |  |  |
| 28 | `h1` | `siteTitle` |  | "Eldrid Tales" |
| 32 | `section` |  | `formContainer` |  |
| 33 | `article` |  | `formTitle` |  |
| 34 | `h2` | `titleText` |  | "Welcome to Your Legend" |
| 37 | `article` |  | `formSectionContainer userNameContainer` |  |
| 38 | `label` | `userNameLabel` | `signinLabel` | "Enter Username"; htmlFor=userName |
| 39 | `input` | `userName` | `signinValue` | type=text |
| 42 | `article` |  | `formSectionContainer passwordContainer ` |  |
| 43 | `label` | `passwordLabel` | `signinLabel` | "Enter Password"; htmlFor=password |
| 44 | `input` | `password` | `signinValue` | type=password |
| 49 | `article` |  | `formSectionContainer buttonContainer` |  |
| 50 | `button` | `loginButton` | `formButton` | "Login"; type=submit |
| 51 | `Link` | `newUserButton` | `formButton` | "Create New User"; to=/register |
| 57 | `p` | `footerText` |  | "© 2026 Eldrid Tales. All rights reserved" |

### pages/ProfilePage.jsx

**CSS:** `../styles/signin.css?inline (as signinCss)`, `usePageStyle(signinCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 32 | `header` | `topContainer` |  |  |
| 37 | `section` | `title-container` | `container` |  |
| 38 | `article` | `title-title` | `title` |  |
| 39 | `h1` | `main-title` | `title-text` | "Profile" |
| 42 | `section` | `look-container` | `container` |  |
| 43 | `article` | `theme-tile` | `tile` |  |
| 44 | `article` | `look-title` | `title` |  |
| 45 | `h2` |  | `title-text` | "Style" |
| 47 | `article` | `theme-value` | `value` |  |
| 48 | `article` | `theme-micro-tile` | `micro-tile` |  |
| 49 | `label` | `theme-label` | `tile-label cap-top` | "Color scheme"; htmlFor=theme-select |
| 50 | `select` | `theme-value` | `tile-value cap-bottom` |  |
| 52 | `option` | dynamic: ``theme-option-${t}`` | `option` |  |
| 56 | `article` | `display-micro-tile` | `micro-tile` |  |
| 57 | `label` | `display-label` | `tile-label cap-top` | "Display"; htmlFor=display-select |
| 58 | `select` | `display-select` | `tile-value cap-bottom` |  |
| 60 | `option` | dynamic: ``display-option-${d}`` | `option` |  |
| 67 | `section` | `info-container` | `container` |  |
| 68 | `article` | `name-tile` | `tile` |  |
| 69 | `article` | `info-title` | `title` |  |
| 70 | `h2` |  | `title-text` | "Information" |
| 72 | `article` | `name-value` | `value micro-tile` |  |
| 73 | `label` | `name-label` | `tile-label cap-top` | "Name"; htmlFor=name-input |
| 74 | `img` |  | `tile-image` | alt=Avatar |
| 80 | `Link` | `homeLink` |  | "Back to home"; to=/home |
| 81 | `p` | `footerText` |  | "copyrite Eldrid Tales LLC" |

### pages/RegisterPage.jsx

**CSS:** `../styles/signin.css?inline (as signinCss)`, `usePageStyle(signinCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 29 | `header` | `topContainer` |  |  |
| 30 | `h1` | `siteTitle` |  | "Eldrid Tales" |
| 34 | `section` | `formContainer` |  |  |
| 35 | `article` | `formTitle` |  |  |
| 36 | `h2` | `titleText` |  | "Create Your Legend" |
| 38 | `form` |  | `formContainer` |  |
| 39 | `article` | `userNameContainer` | `formSectionContainer tile` |  |
| 40 | `label` | `userNameLabel` | `topTile` | "Username"; htmlFor=userName |
| 41 | `input` | `userName` | `bottomTile` | type=text; name=username |
| 44 | `article` | `passwordContainer` | `formSectionContainer tile` |  |
| 45 | `label` | `passwordLabel` | `topTile` | "Password"; htmlFor=password |
| 46 | `input` | `password` | `bottomTile` | type=password; name=password |
| 49 | `article` | `emailContainer` | `formSectionContainer tile` |  |
| 50 | `label` | `emailLabel` | `topTile` | "Email"; htmlFor=email |
| 51 | `input` | `email` | `bottomTile` | type=email; name=email |
| 54 | `article` | `nameContainer` | `formSectionContainer tile` |  |
| 55 | `label` | `nameLabel` | `topTile` | "Display Name"; htmlFor=name |
| 56 | `input` | `name` | `bottomTile` | type=text; name=name |
| 61 | `article` | `regButtonContainer` | `formSectionContainer tile` |  |
| 62 | `button` | `submit` | `formButton` | "Create Account"; type=submit |
| 68 | `p` | `footerText` |  | "© 2026 Eldrid Tales. All rights reserved" |
| 69 | `Link` | `loginLink` |  | "Back to login"; to=/login |

### pages/SettingsPage.jsx

**CSS:** `../styles/home.css?inline (as homeCss)`, `usePageStyle(homeCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 41 | `header` | `topContainer` |  |  |
| 42 | `h1` | `siteTitle` |  | "Welcome" |
| 47 | `section` | `formContainer` |  |  |
| 48 | `article` | `formTitle` |  |  |
| 49 | `h2` | `titleText` |  | "Settings" |
| 50 | `h3` | `subTitleText` |  | "Account Information" |
| 52 | `form` |  | `formContainer` |  |
| 53 | `article` | `userNameContainer` | `formSectionContainer tile` |  |
| 54 | `label` |  | `topTile` | "Username"; htmlFor=username |
| 55 | `input` | `username` | `bottomTile` | type=text; name=username |
| 58 | `article` | `emailContainer` | `formSectionContainer tile` |  |
| 59 | `label` |  | `topTile` | "Email"; htmlFor=email |
| 60 | `input` | `email` | `bottomTile` | type=email; name=email |
| 63 | `article` | `passwordContainer` | `formSectionContainer tile` |  |
| 64 | `label` |  | `topTile` | "Password"; htmlFor=password |
| 65 | `input` | `password` | `bottomTile` | type=password; name=password |
| 70 | `article` | `buttonContainer` | `formSectionContainer` |  |
| 71 | `button` | `submit` | `formButton` | "Update Account"; type=submit |
| 77 | `Link` | `homeLink` |  | "Back to home"; to=/home |
| 78 | `p` | `footerText` |  | "copyrite Eldrid Tales LLC" |

## Edit pages

### pages/edit/EditAbilitiesForm.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 22 | `form` |  | `formContainer` |  |
| 23 | `article` | `statsContainer` | `edit-stats` |  |
| 25 | `article` |  | `formSectionContainer` |  |
| 26 | `span` |  | `cap-top` |  |
| 27 | `button` |  | `cap-bottom rollBtn` | type=button; click: () => reroll(s.key) |
| 34 | `article` |  | `formSectionContainer buttonContainer` |  |
| 35 | `button` |  | `formButton` | "Save Changes"; type=submit |

### pages/edit/EditClassForm.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 26 | `form` |  | `formContainer` |  |
| 27 | `article` |  | `formSectionContainer` |  |
| 28 | `label` |  | `cap-top` | "Select Class"; htmlFor=class_id |
| 29 | `select` | `class_id` | `cap-bottom` |  |
| 35 | `article` |  | `formSectionContainer` |  |
| 36 | `label` |  | `cap-top` | "Select Subclass"; htmlFor=subclass_id |
| 37 | `select` | `subclass_id` | `cap-bottom` |  |
| 44 | `article` |  | `formSectionContainer buttonContainer` |  |
| 45 | `button` |  | `formButton` | "Save Changes"; type=submit |

### pages/edit/EditLevelForm.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 17 | `form` |  | `formContainer` |  |
| 18 | `article` |  | `formSectionContainer` |  |
| 19 | `label` |  | `cap-top` | "Level"; htmlFor=level |
| 20 | `select` | `level` | `cap-bottom` |  |
| 27 | `article` |  | `formSectionContainer buttonContainer` |  |
| 28 | `button` |  | `formButton` | "Save Changes"; type=submit |

### pages/edit/EditNameForm.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 15 | `form` |  | `formContainer` |  |
| 16 | `article` |  | `formSectionContainer` |  |
| 17 | `label` |  | `cap-top` | "Name"; htmlFor=name |
| 18 | `input` | `name` | `cap-bottom` | type=text |
| 20 | `article` |  | `formSectionContainer` |  |
| 21 | `label` |  | `cap-top` | "Select Race"; htmlFor=race_id |
| 22 | `select` | `race_id` | `cap-bottom` |  |
| 29 | `article` |  | `formSectionContainer buttonContainer` |  |
| 30 | `button` |  | `formButton` | "Save Changes"; type=submit |

## Sheet

### sheet/actions/ActionPanel.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 21 | `section` | `action-panel-container` | `container action-container` |  |
| 24 | `article` | `panel-actions` |  |  |
| 28 | `article` | `panel-spells` |  |  |
| 32 | `article` | `panel-inventory` |  |  |
| 36 | `article` | `panel-equipment` |  |  |

### sheet/actions/Actions.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 94 | `ul` |  | `action-list spellList` |  |
| 95 | `li` |  | `action-item spell-slot` |  |
| 96 | `span` | `physical-actions-title` | `action-title` | "Physical Actions" |
| 97 | `ul` | `physical-actions-list` | `action-list` |  |
| 99 | `li` |  | `action-item spell` |  |
| 100 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenItem({ kind: 'wea |
| 103 | `div` |  | `action-button-container` |  |
| 104 | `button` |  | `action-button to-hit-button hover-grow` | type=button; click: () => rollHit(a) |
| 105 | `button` |  | `action-button damage-button hover-grow` | type=button; click: () => rollDamage(a) |
| 112 | `li` |  | `action-item spell-slot` |  |
| 113 | `span` | `magical-actions-title` | `action-title` | "Magical Actions" |
| 114 | `ul` | `magical-actions-list` | `action-list` |  |
| 116 | `li` |  | `action-item spell` | "No spells set as actions yet." |
| 119 | `li` |  | `action-item spell` |  |
| 120 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenItem({ kind: 'spe |
| 124 | `div` |  | `action-button-container` |  |
| 126 | `button` |  | `action-button to-hit-button hover-grow` | type=button; click: () => onCastClick(s, () => cas |
| 131 | `button` |  | `action-button to-hit-button hover-grow` | type=button; click: () => onCastClick(s, () => cas |
| 136 | `button` |  | `action-button damage-button hover-grow` | type=button; click: () => (s.attack_type \|\| s.oppo |
| 138 | `button` |  | `action-button damage-button hover-grow` | "Cast"; type=button; click: () => onCastClick(s, () => cas |
| 143 | `select` |  | `upcast-picker` |  |
| 159 | `li` |  | `action-item spell-slot` |  |
| 160 | `span` | `physical-actions-title` | `action-title` | "Bonus Actions" |
| 161 | `ul` | `physical-actions-list` | `action-list` |  |
| 163 | `li` |  | `action-item spell` |  |
| 164 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenItem({ kind: 'fea |
| 167 | `div` |  | `action-button-container` |  |
| 169 | `button` |  | `action-button damage-button hover-grow` | type=button; click: () => onRoll(`${character.name |
| 174 | `button` |  | `action-button damage-button hover-grow` | "Use"; type=button; click: () => onRoll(`${character.name |
| 184 | `li` |  | `action-item spell-slot` |  |
| 185 | `span` | `reactions-title` | `action-title` | "Reactions" |
| 186 | `ul` | `reactions-list` | `action-list` |  |
| 188 | `li` |  | `action-item spell` |  |
| 189 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenItem({ kind: 'fea |
| 192 | `div` |  | `action-button-container` |  |
| 194 | `button` |  | `action-button damage-button hover-grow` | type=button; click: () => onRoll(`${character.name |
| 199 | `button` |  | `action-button damage-button hover-grow` | "Use"; type=button; click: () => onRoll(`${character.name |
| 209 | `li` |  | `action-item spell-slot` |  |
| 210 | `span` | `feature-actions-title` | `action-title` | "Class Features" |
| 211 | `ul` | `feature-actions-list` | `action-list` |  |
| 213 | `li` |  | `action-item spell` |  |
| 214 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenItem({ kind: 'fea |
| 217 | `div` |  | `action-button-container` |  |
| 219 | `button` |  | `action-button damage-button hover-grow` | type=button; click: () => onRoll(`${character.name |
| 224 | `button` |  | `action-button damage-button hover-grow` | "Use"; type=button; click: () => onRoll(`${character.name |
| 234 | `article` |  | `spell-details` |  |
| 235 | `button` |  | `spell-details-close` | "X"; type=button; click: () => setOpenItem(null) |
| 236 | `h3` |  | `spell-details-title` |  |
| 240 | `section` |  | `details-container` |  |
| 241 | `section` |  | `combat-box` |  |
| 242 | `article` |  | `combat-box-title` |  |
| 243 | `article` |  | `combat-box-content` |  |
| 248 | `section` |  | `spell-build-box` |  |
| 249 | `article` |  | `spell-build-box-title` |  |
| 250 | `article` |  | `spell-build-box-content` |  |
| 256 | `section` |  | `spell-description-box` |  |
| 264 | `section` |  | `details-container` |  |
| 265 | `section` |  | `combat-box` |  |
| 266 | `article` |  | `combat-box-title` |  |
| 267 | `article` |  | `combat-box-content` |  |
| 273 | `section` |  | `spell-build-box` |  |
| 274 | `article` |  | `spell-build-box-title` |  |
| 275 | `article` |  | `spell-build-box-content` |  |
| 282 | `section` |  | `spell-description-box` |  |
| 289 | `section` |  | `details-container` |  |
| 290 | `section` |  | `combat-box` |  |
| 291 | `article` |  | `combat-box-title` |  |
| 292 | `article` |  | `combat-box-content` |  |
| 296 | `section` |  | `spell-build-box` |  |
| 297 | `article` |  | `spell-build-box-title` |  |
| 298 | `article` |  | `spell-build-box-content` |  |

### sheet/actions/InventoryTab.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 54 | `section` | `inventory-container` |  |  |
| 55 | `article` |  | `title-tile` |  |
| 56 | `h3` | `inventory-title` | `action-title` | "Inventory" |
| 57 | `button` |  | `link-button hover-grow` | "Add Armor &amp; weapons"; type=button; click: () => setBrowsing(true) |
| 62 | `ul` |  | `action-list spellList` |  |
| 63 | `li` |  | `action-item spell-slot` |  |
| 64 | `span` | `armorTitle` | `action-title` | "Armor" |
| 65 | `ul` | `armorList` | `action-list` |  |
| 67 | `li` |  | `action-item spell` | "No armor yet." |
| 70 | `li` |  | `action-item spell` |  |
| 73 | `div` |  | `action-button-container` |  |
| 74 | `em` |  | `equipped-item` | "Equipped" |
| 75 | `form` |  | `removeItemForm` |  |
| 76 | `button` |  | `action-button hover-grow` | "Unequip"; type=submit |
| 80 | `form` |  | `equipItemForm` |  |
| 81 | `button` |  | `action-button hover-grow` | "Equip"; type=submit |
| 90 | `li` |  | `action-item spell-slot` |  |
| 91 | `span` | `weaponsTitle` | `action-title` | "Weapons" |
| 92 | `ul` | `weaponsList` | `action-list` |  |
| 94 | `li` |  | `action-item spell` | "No weapons yet." |
| 97 | `li` |  | `action-item spell` |  |
| 100 | `div` |  | `action-button-container` |  |
| 101 | `em` |  | `equipped-item` | "Equipped" |
| 102 | `form` |  | `removeItemForm` |  |
| 103 | `button` |  | `action-button hover-grow` | "Unequip"; type=submit |
| 107 | `form` |  | `equipItemForm` |  |
| 108 | `button` |  | `action-button hover-grow` | "Equip"; type=submit |

### sheet/actions/ItemShop.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 35 | `em` |  | `ownedItem` | "Owned" |
| 36 | `form` |  | `removeItemForm` |  |
| 37 | `button` | `remove-item-button` | `action-button hover-grow` | "Remove"; type=submit |
| 41 | `form` |  | `addItemForm` |  |
| 42 | `button` | `add-item-button` | `action-button hover-grow` | "Add"; type=submit |
| 54 | `section` |  | `title-tile` |  |
| 55 | `h3` |  | `action-title cap-top` | "Item Shop" |
| 56 | `button` |  | `link-button hover-grow` | "Done browsing"; type=button; click: onDone |
| 60 | `section` |  | `panel-shell item-shop` |  |
| 63 | `article` | `inv-panel-armor` | `action-tile inv-panel` |  |
| 64 | `h3` |  | `action-title cap-top` | "Armor" |
| 65 | `ul` |  | `action-list invList` |  |
| 67 | `li` |  | `action-item invListItem` |  |
| 75 | `article` | `inv-panel-weapons` | `action-tile inv-panel` |  |
| 76 | `h3` |  | `action-title cap-top` | "Weapons" |
| 77 | `ul` |  | `action-list invList` |  |
| 79 | `li` |  | `action-item invListItem` |  |

### sheet/actions/ProficienciesTab.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 12 | `h2` | `proficiency-title` | `tab-title` | "Proficiencies" |
| 13 | `ul` | `proficienciesList` | `proficiency-list` |  |
| 14 | `li` |  | `proficiencyItem` |  |
| 15 | `article` |  | `proficiency-tile` |  |
| 16 | `h3` | `proficiencyTitle` | `proficiencyTitle` | "Armor Proficiency" |
| 17 | `ul` |  | `proficiencyList` |  |
| 21 | `p` | `proficiencyValue` | `proficiencyValue` | "-" |
| 26 | `article` |  | `proficiency-tile` |  |
| 27 | `h3` | `proficiencyTitle` | `proficiencyTitle` | "Weapon Proficiency" |
| 28 | `ul` |  | `proficiencyList` |  |
| 32 | `p` | `proficiencyValue` | `proficiencyValue` | "-" |
| 37 | `article` |  | `proficiency-tile` |  |
| 38 | `h3` | `proficiencyTitle` | `proficiencyTitle` | "Tool Proficiency" |
| 39 | `ul` |  | `proficiencyList` |  |
| 43 | `p` | `proficiencyValue` | `proficiencyValue` | "-" |

### sheet/actions/SpellBook.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 39 | `em` |  | `learnedSpell` | "Learned" |
| 40 | `form` |  | `forgetSpellForm` |  |
| 41 | `button` | `forget-spell-button` | `action-button hover-grow` | "Forget"; type=submit |
| 45 | `form` |  | `learnSpellForm` |  |
| 46 | `button` | `learn-spell-button` | `action-button hover-grow` | "Learn"; type=submit |
| 60 | `section` |  | `title-tile` |  |
| 61 | `h3` |  | `action-title cap-top` | "Study Arcana" |
| 62 | `button` |  | `link-button hover-grow` | "Close the Book"; type=button; click: onDone |
| 66 | `section` |  | `panel-shell spell-book-tabs` |  |
| 69 | `article` | `spell-panel-level_0` | `action-tile spell-panel` |  |
| 70 | `h3` |  | `action-title cap-top` | "Low Level Spells" |
| 71 | `ul` |  | `action-list spellList` |  |
| 73 | `li` |  | `action-item spell-item` |  |
| 74 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 80 | `article` | `spell-panel-level_1` | `action-tile spell-panel` |  |
| 81 | `h3` |  | `action-title cap-top` | "Level 1 Spells" |
| 82 | `ul` |  | `action-list spellList` |  |
| 84 | `li` |  | `action-item spell-item` |  |
| 85 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 91 | `article` | `spell-panel-level_2` | `action-tile spell-panel` |  |
| 92 | `h3` |  | `action-title cap-top` | "Level 2 Spells" |
| 93 | `ul` |  | `action-list spellList` |  |
| 95 | `li` |  | `action-item spell-item` |  |
| 96 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 102 | `article` | `spell-panel-level_3` | `action-tile spell-panel` |  |
| 103 | `h3` |  | `action-title cap-top` | "Level 3 Spells" |
| 104 | `ul` |  | `action-list spellList` |  |
| 106 | `li` |  | `action-item spell-item` |  |
| 107 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 113 | `article` | `spell-panel-level_4` | `action-tile spell-panel` |  |
| 114 | `h3` |  | `action-title cap-top` | "Level 4 Spells" |
| 115 | `ul` |  | `action-list spellList` |  |
| 117 | `li` |  | `action-item spell-item` |  |
| 118 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 124 | `article` | `spell-panel-level_5` | `action-tile spell-panel` |  |
| 125 | `h3` |  | `action-title cap-top` | "Level 5 Spells" |
| 126 | `ul` |  | `action-list spellList` |  |
| 128 | `li` |  | `action-item spell-item` |  |
| 129 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 135 | `article` | `spell-panel-level_6` | `action-tile spell-panel` |  |
| 136 | `h3` |  | `action-title cap-top` | "Level 6 Spells" |
| 137 | `ul` |  | `action-list spellList` |  |
| 139 | `li` |  | `action-item spell-item` |  |
| 140 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 146 | `article` | `spell-panel-level_7` | `action-tile spell-panel` |  |
| 147 | `h3` |  | `action-title cap-top` | "Level 7 Spells" |
| 148 | `ul` |  | `action-list spellList` |  |
| 150 | `li` |  | `action-item spell-item` |  |
| 151 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 157 | `article` | `spell-panel-level_8` | `action-tile spell-panel` |  |
| 158 | `h3` |  | `action-title cap-top` | "Level 8 Spells" |
| 159 | `ul` |  | `action-list spellList` |  |
| 161 | `li` |  | `action-item spell-item` |  |
| 162 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |
| 168 | `article` | `spell-panel-level_9` | `action-tile spell-panel` |  |
| 169 | `h3` |  | `action-title cap-top` | "Level 9 Spells" |
| 170 | `ul` |  | `action-list spellList` |  |
| 172 | `li` |  | `action-item spell-item` |  |
| 173 | `button` |  | `action-label spellName spell-name-button hover-grow` | type=button; click: () => onOpenSpell?.(s) |

### sheet/actions/SpellsTab.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 70 | `button` |  | `action-button to-hit-button hover-grow` | type=button; click: () => cast(`${who} casts ${s.n |
| 72 | `button` |  | `action-button to-hit-button hover-grow` | type=button; click: () => cast(`${who} casts ${s.n |
| 76 | `button` |  | `action-button damage-button hover-grow` | type=button; click: () => hasFirst ? onRoll?.(dama |
| 78 | `button` |  | `action-button damage-button hover-grow` | "Cast"; type=button; click: () => cast(`${who} casts ${s.n |
| 99 | `article` |  | `spell-details` |  |
| 100 | `button` |  | `spell-details-close` | "X"; type=button; click: () => setOpenSpell(null) |
| 101 | `h3` |  | `spell-details-title` |  |
| 102 | `section` |  | `details-container` |  |
| 103 | `section` |  | `combat-box` |  |
| 104 | `article` |  | `combat-box-title` |  |
| 107 | `article` |  | `combat-box-content` |  |
| 113 | `section` |  | `spell-build-box` |  |
| 114 | `article` |  | `spell-build-box-title` |  |
| 117 | `article` |  | `spell-build-box-content` |  |
| 124 | `section` |  | `spell-description-box` |  |
| 140 | `section` |  | `title-tile` |  |
| 141 | `h2` | `spell-title` | `action-tab-title` | "Spell Book" |
| 142 | `article` |  | `action-button-container spell-stat-bar` |  |
| 143 | `button` |  | `link-button hover-grow` | "Consult the Scrolls"; type=button; click: () => setBrowsing(true) |
| 144 | `p` |  | `spell-stat` | "Primary Stat:" |
| 145 | `p` |  | `spell-stat` | "Damage Bonus:" |
| 146 | `p` |  | `spell-stat` | "Target Save:" |
| 152 | `section` |  | `panel-shell spells-tab` |  |
| 156 | `article` | `spells-panel-prepared` | `action-tile spells-panel` |  |
| 157 | `ul` |  | `action-list spellList` |  |
| 158 | `li` |  | `action-item spell-slot` |  |
| 159 | `span` |  | `action-title` | "Low Level Spells" |
| 160 | `ul` |  | `action-list` |  |
| 162 | `li` |  | `action-item spell` |  |
| 163 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenSpell(s) |
| 164 | `article` |  | `action-button-container` |  |
| 170 | `li` |  | `action-item spell-slot` |  |
| 171 | `span` |  | `action-title` | "Level" |
| 173 | `input` |  | `spell-slot-checkbox` | "))}"; type=checkbox |
| 178 | `ul` |  | `action-list` |  |
| 180 | `li` |  | `action-item spell` |  |
| 181 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenSpell(s) |
| 182 | `article` |  | `action-button-container` |  |
| 186 | `li` |  | `action-item spell upcast-spell` |  |
| 187 | `button` |  | `spell-name-button hover-grow` | type=button; click: () => setOpenSpell(s) |
| 188 | `article` |  | `action-button-container` |  |
| 196 | `article` | `spells-panel-learned` | `action-tile spells-panel` |  |
| 200 | `ul` |  | `action-list spellList` |  |
| 202 | `li` |  | `action-item` |  |
| 204 | `article` |  | `action-button-container` |  |
| 205 | `form` |  | `removeSpellForm` |  |
| 206 | `button` | `unlearn-spell-button` | `action-button hover-grow` | "Unlearn"; type=submit |
| 208 | `form` |  | `prepareSpellForm` |  |
| 209 | `button` |  | `action-button hover-grow` | type=submit |
| 213 | `form` |  | `setActionForm` |  |
| 214 | `button` |  | `action-button hover-grow` | type=submit |

### sheet/ArmorClass.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 13 | `section` | `armor-class-container` | `container` |  |
| 14 | `article` | `armor-class-tile-container` | `tile armor-class-tile` |  |
| 15 | `p` | `armor-class-tile-label` | `tile-component label-component cap-top` | "Armor Class" |
| 16 | `p` | `armor-class-tile-value` | `tile-component value-component cap-bottom` |  |

### sheet/CharacterHeader.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 6 | `section` | `siteTitle` |  |  |
| 9 | `section` | `characterHeader` |  |  |
| 10 | `h2` | `characterName` |  |  |
| 11 | `p` | `characterRace` |  |  |
| 12 | `p` | `characterClass` |  |  |

### sheet/CharacterSheet.jsx

**CSS:** `../styles/charSheet.css?inline (as sheetCss)`, `usePageStyle(sheetCss)`

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 84 | `TabList` |  | `sheet-tabs action-tab-list` |  |
| 93 | `section` | `sheet-panel-stats` | `sheet-panel` |  |
| 94 | `section` | `stat-container` | `container` |  |
| 102 | `section` | `sheet-panel-actions` | `sheet-panel` |  |
| 108 | `section` | `sheet-panel-conditions` | `sheet-panel` |  |
| 109 | `HealthBox` | dynamic: `character.id` |  |  |

### sheet/Conditions.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 17 | `label` | dynamic: ``${name}Label`` | `conditionLabel` | htmlFor=name |
| 20 | `input` | dynamic: `name` | `condition-checkbox` | type=checkbox |
| 31 | `section` | `conditions-container` | `container condition-container` |  |
| 32 | `p` | `condition-title` | `tile-component label-component cap-top` | "Conditions" |
| 33 | `article` |  | `tile condition-tile` |  |
| 34 | `article` | `conditions-list-1` | `tile-component list-component` |  |
| 35 | `article` | `conditions-list-2` | `tile-component list-component` |  |
| 36 | `article` | `conditions-list-3` | `tile-component list-component` |  |
| 37 | `label` | `exhausted-label` | `tile-component exhausted-component label-component` | "Exhausted"; htmlFor=exhausted-value |
| 38 | `input` | `exhausted-value` | `tile-component exhausted-component range-component` | type=range |

### sheet/HealthBox.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 25 | `section` | `health-container` | `container health-container` |  |
| 26 | `article` |  | `tile health-button-tile` |  |
| 27 | `button` | `heal-button` | `tile-component button-tile-component button-component hover-grow` | "Heal"; type=button; click: () => change('heal') |
| 28 | `input` | `hp-input` | `tile-component button-tile-component input-component` | type=number |
| 29 | `button` | `damage-button` | `tile-component button-tile-component button-component hover-grow` | "Damage"; type=button; click: () => change('damage') |
| 31 | `article` |  | `tile current-hp-tile` |  |
| 32 | `p` | `current-hp-label` | `tile-component label-component hp-label-component` | "Current HP" |
| 33 | `p` | dynamic: `hp === 0 ? 'current-hp-value--fallen' : 'current-hp-value'` | `tile-component value-component hp-value-component` |  |
| 35 | `article` |  | `tile max-hp-tile` |  |
| 36 | `p` | `max-hp-label` | `tile-component label-component hp-label-component` | "Max HP" |
| 37 | `p` | `max-hp-value` | `tile-component value-component hp-value-component` |  |
| 39 | `article` |  | `hp-bar-tile` |  |
| 40 | `div` | `hp-bar-fill` | `tile-component bar-component` |  |

### sheet/Initiative.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 8 | `section` | `initiative-container` | `container` |  |
| 9 | `article` | `initiative-tile-container` | `tile initiative-tile` | click: () => onRoll(`Initiative: ${d2 |
| 10 | `p` | `initiative-tile-label` | `tile-component label-component cap-top` | "Initiative" |
| 11 | `p` | `initiative-tile-value` | `tile-component value-component` |  |

### sheet/RollOrb.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 36 | `div` | `rollOrb` | dynamic: `classes` |  |
| 48 | `div` |  | `roll-orb-face` |  |
| 49 | `div` |  | `roll-orb__panel` |  |
| 50 | `p` |  | `roll-orb__label` |  |
| 51 | `p` |  | `roll-orb__total` |  |
| 52 | `p` |  | `roll-orb__detail` |  |

### sheet/SheetNav.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 8 | `nav` | `navBox` |  |  |
| 9 | `ul` | `navContainer` |  |  |
| 10 | `Link` | `homeNav` | `drop-button navButton hover-grow` | "home"; to=/home |
| 13 | `li` | `characterNav` | `navButton` | "Characters" |
| 14 | `ul` | `characterDropdown` | `dropDown` |  |
| 15 | `Link` | `createCharacter` | `drop-button characterDropdownButton` | "Create Character"; to=/create_char |
| 16 | `Link` | `characterList` | `drop-button characterDropdownButton` | "Character List"; to=/char_list |
| 20 | `li` | `campaignNav` | `navButton` | "Character Editor" |
| 21 | `ul` | `campaignDropdown` | `dropDown` |  |
| 22 | `Link` | `charSheetEdit` | `drop-button campaignDropdownButton` | "Edit Character"; to=`/characters/${characterId}/ed |
| 26 | `li` | `settingsNav` | `navButton` | "Settings" |
| 27 | `ul` | `settingsDropdown` | `dropDown` |  |
| 28 | `Link` | `profile` | `drop-button settingsDropdownButton` | "Profile"; to=/profile |
| 29 | `Link` | `settings` | `drop-button settingsDropdownButton` | "Settings"; to=/settings |

### sheet/Skills.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 8 | `section` | `skills-container` | `container skills-container` |  |
| 9 | `p` | `skills-title` | `container-title cap-top` | "Skills" |
| 14 | `article` | dynamic: ``${skill.id}-container`` | `tile skill-tile hover-grow` | click: () => onRoll(`${skill.name} ch |
| 20 | `p` | dynamic: ``${skill.id}-label`` | `tile-component label-component skill-label cap-top` |  |
| 21 | `p` | dynamic: ``${skill.id}-value`` | `tile-component value-component skill-value cap-bottom` |  |

### sheet/StatBox.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 8 | `article` |  | `stat-tile tile hover-grow` | click: roll |
| 9 | `p` | `stat-tile-label` | `tile-component label-component cap-top` |  |
| 10 | `p` | `stat-tile-modifier` | `tile-component modifier-component` |  |
| 11 | `p` | `stat-tile-value` | `tile-component value-component cap-bottom` |  |

## Components

### components/LogoutLink.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 14 | `a` | `logout` | `settingsDropdownButton` | "Log Out"; click: logout |

### components/RequireLogin.jsx

**CSS:** none directly (inherits from parent page)

_No className/id used._

### components/SiteNav.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 7 | `nav` | `navBox` |  |  |
| 8 | `ul` | `navContainer` |  |  |
| 9 | `Link` | `homeNav` | `navButton` | "home"; to=/home |
| 11 | `li` | `characterNav` | `navButton` | "Characters" |
| 12 | `ul` | `characterDropdown` | `dropDown` |  |
| 13 | `Link` | `createCharacter` | `characterDropdownButton` | "Create Character"; to=/create_char |
| 14 | `Link` | `characterList` | `characterDropdownButton` | "Character List"; to=/char_list |
| 18 | `li` | `campaignNav` | `navButton` | "Campaigns" |
| 19 | `ul` | `campaignDropdown` | `dropDown` |  |
| 20 | `Link` | `createCampaign` | `campaignDropdownButton` | "Create Campaign"; to=/create_campaign |
| 21 | `Link` | `campaignList` | `campaignDropdownButton` | "Campaign List"; to=/campaign_list |
| 22 | `Link` | `premadeCampaigns` | `campaignDropdownButton` | "Premade Campaigns"; to=/premade |
| 26 | `li` | `settingsNav` | `navButton` | "Settings" |
| 27 | `ul` | `settingsDropdown` | `dropDown` |  |
| 28 | `Link` | `profile` | `settingsDropdownButton` | "Profile"; to=/profile |
| 29 | `Link` | `settings` | `settingsDropdownButton` | "Settings"; to=/settings |

### components/TabList.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 5 | `article` |  | dynamic: `className` |  |
| 7 | `button` | dynamic: ``${prefix}tab-${t.id}`` |  | type=button; click: () => onChange(t.id) |

### components/ThemePicker.jsx

**CSS:** none directly (inherits from parent page)

| Line | Tag | id | className | What it is |
|---|---|---|---|---|
| 17 | `article` | `themeNav` | `navButton` |  |
| 18 | `label` |  | `cap-top` | "Color scheme"; htmlFor=theme-select |
| 19 | `select` | `theme-select` | `cap-bottom` |  |

## App root

### App.jsx

**CSS:** none directly (inherits from parent page)

_No className/id used._

### main.jsx

**CSS:** `./styles/global.css`

_No className/id used._

## Selector check

### Classes used in JSX with NO selector in styles/*.css (46)
`action-label` (sheet/actions/SpellBook.jsx), `addItemForm` (sheet/actions/ItemShop.jsx), `bar-component` (sheet/HealthBox.jsx), `character-tile` (pages/HomePage.jsx), `combat-box-content` (sheet/actions/Actions.jsx, sheet/actions/SpellsTab.jsx), `combat-box-title` (sheet/actions/Actions.jsx, sheet/actions/SpellsTab.jsx), `conditionLabel` (sheet/Conditions.jsx), `container-title` (sheet/Skills.jsx), `damage-button` (sheet/actions/Actions.jsx, sheet/actions/SpellsTab.jsx), `edit-panel` (pages/EditCharacterPage.jsx), `equipItemForm` (sheet/actions/InventoryTab.jsx), `forgetSpellForm` (sheet/actions/SpellBook.jsx), `input-component` (sheet/HealthBox.jsx), `inv-panel` (sheet/actions/ItemShop.jsx), `invListItem` (sheet/actions/ItemShop.jsx), `label-component` (sheet/ArmorClass.jsx, sheet/Conditions.jsx, sheet/HealthBox.jsx, sheet/Initiative.jsx, sheet/Skills.jsx, sheet/StatBox.jsx), `learnSpellForm` (sheet/actions/SpellBook.jsx), `list-component` (sheet/Conditions.jsx), `modifier-component` (sheet/StatBox.jsx), `option` (pages/ProfilePage.jsx), `ownedItem` (sheet/actions/ItemShop.jsx), `prepareSpellForm` (sheet/actions/SpellsTab.jsx), `proficiencyItem` (sheet/actions/ProficienciesTab.jsx), `proficiencyList` (sheet/actions/ProficienciesTab.jsx), `proficiencyTitle` (sheet/actions/ProficienciesTab.jsx), `proficiencyValue` (sheet/actions/ProficienciesTab.jsx), `range-component` (sheet/Conditions.jsx), `removeItemForm` (sheet/actions/InventoryTab.jsx, sheet/actions/ItemShop.jsx), `removeSpellForm` (sheet/actions/SpellsTab.jsx), `roll-orb__detail` (sheet/RollOrb.jsx), `roll-orb__label` (sheet/RollOrb.jsx), `roll-orb__total` (sheet/RollOrb.jsx), `setActionForm` (sheet/actions/SpellsTab.jsx), `spell` (sheet/actions/Actions.jsx, sheet/actions/InventoryTab.jsx, sheet/actions/SpellsTab.jsx), `spell-build-box-content` (sheet/actions/Actions.jsx, sheet/actions/SpellsTab.jsx), `spell-build-box-title` (sheet/actions/Actions.jsx, sheet/actions/SpellsTab.jsx), `spell-item` (sheet/actions/SpellBook.jsx), `spell-panel` (sheet/actions/SpellBook.jsx), `spellName` (sheet/actions/SpellBook.jsx), `tile-component` (sheet/ArmorClass.jsx, sheet/Conditions.jsx, sheet/HealthBox.jsx, sheet/Initiative.jsx, sheet/Skills.jsx, sheet/StatBox.jsx), `tile-image` (pages/ProfilePage.jsx), `tile-text` (pages/HomePage.jsx), `title-text` (pages/HomePage.jsx, pages/ProfilePage.jsx), `to-hit-button` (sheet/actions/Actions.jsx, sheet/actions/SpellsTab.jsx), `upcast-spell` (sheet/actions/SpellsTab.jsx), `value-component` (sheet/ArmorClass.jsx, sheet/HealthBox.jsx, sheet/Initiative.jsx, sheet/Skills.jsx, sheet/StatBox.jsx)

### ids used in JSX with NO selector (121)
`action-panel-container` (sheet/actions/ActionPanel.jsx), `add-item-button` (sheet/actions/ItemShop.jsx), `armorList` (sheet/actions/InventoryTab.jsx), `armorTitle` (sheet/actions/InventoryTab.jsx), `baseStatItemContainer` (pages/CreateStep3.jsx), `campaignDropdown` (components/SiteNav.jsx, sheet/SheetNav.jsx), `charSheetEdit` (sheet/SheetNav.jsx), `characterDropdown` (components/SiteNav.jsx, sheet/SheetNav.jsx), `classContainer` (pages/CreateStep2.jsx), `class_id` (pages/CreateStep2.jsx, pages/edit/EditClassForm.jsx), `conditions-container` (sheet/Conditions.jsx), `createCampaign` (components/SiteNav.jsx), `createCharacter` (components/SiteNav.jsx, sheet/SheetNav.jsx), `current-campaign-container` (pages/HomePage.jsx), `current-campaign-list` (pages/HomePage.jsx), `current-campaign-title` (pages/HomePage.jsx), `current-character-list` (pages/HomePage.jsx), `current-character-title` (pages/HomePage.jsx), `current-hp-label` (sheet/HealthBox.jsx), `current-hp-value` (sheet/HealthBox.jsx), `descArticle` (pages/CreateDescription.jsx), `display-label` (pages/ProfilePage.jsx), `display-micro-tile` (pages/ProfilePage.jsx), `display-select` (pages/ProfilePage.jsx), `edit-panel-abilities` (pages/EditCharacterPage.jsx), `edit-panel-class` (pages/EditCharacterPage.jsx), `edit-panel-level` (pages/EditCharacterPage.jsx), `edit-panel-name` (pages/EditCharacterPage.jsx), `editLink` (pages/EditCharacterPage.jsx), `editTitle` (pages/EditCharacterPage.jsx), `email` (pages/RegisterPage.jsx, pages/SettingsPage.jsx), `emailLabel` (pages/RegisterPage.jsx), `exhausted-label` (sheet/Conditions.jsx), `exhausted-value` (sheet/Conditions.jsx), `feature-actions-list` (sheet/actions/Actions.jsx), `feature-actions-title` (sheet/actions/Actions.jsx), `forget-spell-button` (sheet/actions/SpellBook.jsx), `health-container` (sheet/HealthBox.jsx), `info-title` (pages/ProfilePage.jsx), `inv-panel-armor` (sheet/actions/ItemShop.jsx), `inv-panel-weapons` (sheet/actions/ItemShop.jsx), `inventory-container` (sheet/actions/InventoryTab.jsx), `inventory-link` (pages/InventoryPage.jsx), `inventory-title` (pages/InventoryPage.jsx, sheet/actions/InventoryTab.jsx), `learn-spell-button` (sheet/actions/SpellBook.jsx), `level` (pages/edit/EditLevelForm.jsx), `loginButton` (pages/LoginPage.jsx), `loginLink` (pages/RegisterPage.jsx), `logout` (components/LogoutLink.jsx), `look-title` (pages/ProfilePage.jsx), `magical-actions-list` (sheet/actions/Actions.jsx), `magical-actions-title` (sheet/actions/Actions.jsx), `main-title` (pages/ProfilePage.jsx), `max-hp-label` (sheet/HealthBox.jsx), `max-hp-value` (sheet/HealthBox.jsx), `name-label` (pages/ProfilePage.jsx), `name-tile` (pages/ProfilePage.jsx), `name-value` (pages/ProfilePage.jsx), `nameContainer` (pages/RegisterPage.jsx), `nameLabel` (pages/RegisterPage.jsx), `newUserButton` (pages/LoginPage.jsx), `panel-equipment` (sheet/actions/ActionPanel.jsx), `panel-inventory` (sheet/actions/ActionPanel.jsx), `panel-spells` (sheet/actions/ActionPanel.jsx), `password` (pages/LoginPage.jsx, pages/RegisterPage.jsx, pages/SettingsPage.jsx), `passwordLabel` (pages/LoginPage.jsx, pages/RegisterPage.jsx), `physical-actions-list` (sheet/actions/Actions.jsx), `physical-actions-title` (sheet/actions/Actions.jsx), `plus1Container` (pages/CreateStep3.jsx), `plus2Container` (pages/CreateStep3.jsx), `premadeCampaigns` (components/SiteNav.jsx), `proficienciesList` (sheet/actions/ProficienciesTab.jsx), `proficiency-title` (sheet/actions/ProficienciesTab.jsx), `proficiencyTitle` (sheet/actions/ProficienciesTab.jsx), `proficiencyValue` (sheet/actions/ProficienciesTab.jsx), `profile` (components/SiteNav.jsx, sheet/SheetNav.jsx), `race_id` (pages/CreateStep1.jsx, pages/edit/EditNameForm.jsx), `reactions-list` (sheet/actions/Actions.jsx), `reactions-title` (sheet/actions/Actions.jsx), `regButtonContainer` (pages/RegisterPage.jsx), `remove-item-button` (sheet/actions/ItemShop.jsx), `rollOrb` (sheet/RollOrb.jsx), `settings` (components/SiteNav.jsx, sheet/SheetNav.jsx), `settingsDropdown` (components/SiteNav.jsx, sheet/SheetNav.jsx), `sheet-panel-stats` (sheet/CharacterSheet.jsx), `spell-panel-level_0` (sheet/actions/SpellBook.jsx), `spell-panel-level_1` (sheet/actions/SpellBook.jsx), `spell-panel-level_2` (sheet/actions/SpellBook.jsx), `spell-panel-level_3` (sheet/actions/SpellBook.jsx), `spell-panel-level_4` (sheet/actions/SpellBook.jsx), `spell-panel-level_5` (sheet/actions/SpellBook.jsx), `spell-panel-level_6` (sheet/actions/SpellBook.jsx), `spell-panel-level_7` (sheet/actions/SpellBook.jsx), `spell-panel-level_8` (sheet/actions/SpellBook.jsx), `spell-panel-level_9` (sheet/actions/SpellBook.jsx), `spell-title` (sheet/actions/SpellsTab.jsx), `spells-panel-prepared` (sheet/actions/SpellsTab.jsx), `statsContainer` (pages/edit/EditAbilitiesForm.jsx), `subClassContainer` (pages/CreateStep2.jsx), `subTitleText` (pages/SettingsPage.jsx), `subclass_id` (pages/CreateStep2.jsx, pages/edit/EditClassForm.jsx), `textSection` (pages/CreateDescription.jsx), `theme-label` (pages/ProfilePage.jsx), `theme-micro-tile` (pages/ProfilePage.jsx), `theme-select` (components/ThemePicker.jsx), `theme-tile` (pages/ProfilePage.jsx), `theme-value` (pages/ProfilePage.jsx), `title` (pages/CreateDescription.jsx), `title-title` (pages/ProfilePage.jsx), `titleSection` (pages/CreateDescription.jsx), `titleText` (pages/LoginPage.jsx, pages/RegisterPage.jsx, pages/SettingsPage.jsx), `topContainer` (pages/CreateStep1.jsx, pages/CreateStep2.jsx, pages/CreateStep3.jsx, pages/HomePage.jsx, pages/LoginPage.jsx, pages/ProfilePage.jsx, pages/RegisterPage.jsx, pages/SettingsPage.jsx), `unfinished-character-container` (pages/HomePage.jsx), `unfinished-character-list` (pages/HomePage.jsx), `unfinished-character-title` (pages/HomePage.jsx), `unlearn-spell-button` (sheet/actions/SpellsTab.jsx), `userName` (pages/LoginPage.jsx, pages/RegisterPage.jsx), `userNameLabel` (pages/LoginPage.jsx, pages/RegisterPage.jsx), `username` (pages/SettingsPage.jsx), `weaponsList` (sheet/actions/InventoryTab.jsx), `weaponsTitle` (sheet/actions/InventoryTab.jsx)

### Dynamic class pieces (prefix + runtime value)
`#{*}tab-{*}`, `#character-tile-{*}`, `#theme-option-{*}`, `#display-option-{*}`, `#{*}Label`, `#{*}-container`, `#{*}-label`, `#{*}-value`

### CSS classes never used in JSX (0)
_none_

### CSS ids never used in JSX (8)
`condition-checkbox` (styles/charSheet.css), `currentCampaign` (styles/home.css), `currentCharacters` (styles/home.css), `descText` (styles/char_create.css), `healthContainer` (styles/charSheet.css), `root` (styles/global.css), `unfinishedCharacters` (styles/home.css), `unfinishedList` (styles/home.css)

_Note: theme classes (e.g. applied to body/html from JS) or classes set from .js files may show as "unused" here._
