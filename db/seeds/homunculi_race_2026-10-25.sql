-- Homunculi playable race (2026-10-25). Rules: handbook rules/homunculi-race.md [LOCKED]. Idempotent, single transaction.
BEGIN;

INSERT INTO races (name, creature_type, traits, size, base_speed, resistances, darkvision, img_url, signature_state_id, race_spell_id)
SELECT 'Homunculi', 'Humanoid',
  'Artificial souls created by alchemists seeking immortality. Most are considered failed experiments and treated poorly, but some are treated as family. Their skin is ivory and porcelain-like, ringed with fine gold seams at the wrists, elbows and shoulders, and their soul is a sentient glossy black liquid that drifts around them in ribbons and droplets. They are rare, and most can blend into normal society. Languages: Common plus one language of your choice.',
  'Small or Medium', 30, 'Poison', false, '/races/homunculi.png',
  (SELECT id FROM spell_state WHERE name = 'manipulate'),
  (SELECT id FROM spells WHERE name = 'Bend Water' AND base_level = 0 ORDER BY id LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Homunculi');

UPDATE races SET creature_type = 'Humanoid', size = 'Small or Medium', base_speed = 30, resistances = 'Poison', darkvision = false,
  img_url = '/races/homunculi.png',
  signature_state_id = (SELECT id FROM spell_state WHERE name = 'manipulate'),
  race_spell_id = (SELECT id FROM spells WHERE name = 'Bend Water' AND base_level = 0 ORDER BY id LIMIT 1)
WHERE name = 'Homunculi';

INSERT INTO race_traits (race_id, creature_type, size, base_speed, resistances, dark_vision)
SELECT r.id, 'Humanoid', 'Small or Medium', 30, 'Poison', false FROM races r
WHERE r.name = 'Homunculi' AND NOT EXISTS (SELECT 1 FROM race_traits t WHERE t.race_id = r.id);

INSERT INTO race_affinity_elements (race_id, subrace_id, element_id)
SELECT r.id, NULL, e.id FROM races r CROSS JOIN spell_element e
WHERE r.name = 'Homunculi' AND e.name IN ('Flood', 'Body')
  AND NOT EXISTS (SELECT 1 FROM race_affinity_elements x WHERE x.race_id = r.id AND x.element_id = e.id AND x.subrace_id IS NULL);

INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, v.name, v.description, NULL, NULL, 1, v.action_type, v.uses, v.dice
FROM races r CROSS JOIN (VALUES
  ('Remold', 'Minor remold (bonus action, at will): change your face and build within your current size: features, skin markings and colour, hair, eyes, voice pitch, height (up to 1 ft) and frame. Full remold (action, 1 per short rest; PB per long rest from level 11): also change size between Small and Medium (speed 25/30 ft; a size change ends after 1 hour) or copy a specific Humanoid you saw clearly for 1 minute in the last 24 hours. Only your body changes, not your gear; armor fitted to your old size gives no AC until you change back. You can''t change creature type, limbs, senses or statistics. A remold ends when you remold again, choose to, or drop to 0 HP. Advantage on Guile checks to pass as someone else while remolded. A suspicious creature can use its action for a Reading People or Watchfulness check against DC 8 + PB + CHA to see through it.', 'bonus', 'At will; Full remold 1 per short rest', NULL),
  ('Soul Tide', 'When a creature you can see within 5 ft hits you with an attack, your soul-liquid lashes out: reduce the damage by 1d6 + your CON modifier (minimum 1).', 'reaction', '1 per short rest', '1d6'),
  ('Liquid Reach', 'Your soul-liquid can carry out simple tasks within 5 ft: lift or hold an object of 5 lb or less, open an unlocked door or container, or pass an item to an adjacent ally. It can''t attack, wield a weapon or activate magic items. Using it costs your free object interaction.', NULL, 'Passive', NULL),
  ('Unfed Vessel', 'You don''t need to eat, drink or sleep. You go still for 4 hours to gain the benefit of a long rest, staying aware of your surroundings. Advantage on saves against being poisoned.', NULL, 'Passive', NULL)
) AS v(name, description, action_type, uses, dice)
WHERE r.name = 'Homunculi' AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = v.name);

COMMIT;
