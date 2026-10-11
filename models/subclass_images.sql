-- Gives every subclass its picture path.
-- Paths start with "/" because Express serves the Public folder at the site root.
-- Matched by id, because several names differ from the file names (e.g. Venombound vs venom-bound).

UPDATE sub_classes SET img_url = '/subclasses/' || v.file
FROM (VALUES
  (18, 'sub-assassin-ghost-walker.png'),
  (16, 'sub-assassin-shadowblade.png'),
  (17, 'sub-assassin-venom-bound.png'),
  (30, 'sub-berserker-bloodwake.png'),
  (28, 'sub-berserker-frenzy.png'),
  (29, 'sub-berserker-ironhide.png'),
  (26, 'sub-druid-beasts.png'),
  (25, 'sub-druid-roots.png'),
  (27, 'sub-druid-seasons.png'),
  (19, 'sub-knight-cavalier.png'),
  (21, 'sub-knight-crown-guard.png'),
  (20, 'sub-knight-shieldbearer.png'),
  (34, 'sub-lancer-phalanx.png'),
  (35, 'sub-lancer-skyreach.png'),
  (36, 'sub-lancer-twinstrike.png'),
  (4,  'sub-mage-evoker.png'),
  (5,  'sub-mage-runeweaver.png'),
  (6,  'sub-mage-scholar.png'),
  (12, 'sub-paladin-ochre.png'),
  (14, 'sub-paladin-shadows.png'),
  (15, 'sub-paladin-starlight.png'),
  (13, 'sub-paladin-umber.png'),
  (38, 'sub-priest-binder.png'),
  (37, 'sub-priest-lightbearer.png'),
  (39, 'sub-priest-shadow-whisper.png'),
  (33, 'sub-pugilist-iron.png'),
  (32, 'sub-pugilist-bear.png'),
  (31, 'sub-pugilist-tiger.png'),
  (22, 'sub-ranger-archer.png'),
  (24, 'sub-ranger-stalker.png'),
  (23, 'sub-ranger-tamer.png'),
  (46, 'sub-songsmith-diresong.png'),
  (45, 'sub-songsmith-loresong.png'),
  (44, 'sub-songsmith-warsong.png'),
  (41, 'sub-summoner-hollowmancer.png'),
  (40, 'sub-summoner-necromancer.png'),
  (43, 'sub-summoner-technomancer.png'),
  (1,  'sub-warrior-vanguard.png'),
  (3,  'sub-warrior-warlord.png'),
  (2,  'sub-warrior-weaponmaster.png'),
  (8,  'sub-witch-blood.png'),
  (9,  'sub-witch-fate.png'),
  (10, 'sub-witch-green.png'),
  (7,  'sub-witch-hex.png'),
  (11, 'sub-witch-witch-knight.png')
) AS v(id, file)
WHERE sub_classes.id = v.id;

-- Check: this should return 0 rows.
SELECT id, name FROM sub_classes WHERE img_url IS NULL;
