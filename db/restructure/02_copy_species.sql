-- Copy old races into the new species table (restructure branch only)
-- One size per species: 1 Tiny, 2 Small, 3 Medium, 4 Large, 5 Enormous, 6 Titanic
BEGIN;

-- Step 1: the main species, with new names and one size each
INSERT INTO species (key, name, size_id, speed, description, image, sort_order)
SELECT m.key, m.new_name, m.size_id, r.base_speed, r.traits, r.img_url, r.id
FROM races r
JOIN (VALUES
  (1,  'human',      'Human',      3),
  (2,  'uron',       'Uron',       4),
  (3,  'dawn_elf',   'Dawn Elf',   3),
  (4,  'morrow_elf', 'Morrow Elf', 3),
  (5,  'ouros',      'Ouros',      4),
  (6,  'dwarf',      'Dwarf',      2),
  (7,  'halfling',   'Halfling',   2),
  (8,  'dusk_elf',   'Dusk Elf',   3),
  (9,  'vantus',     'Vantus',     3),
  (10, 'ent',        'Ent',        3),
  (11, 'igni',       'Igni',       3),
  (12, 'vellari',    'Vellari',    3),
  (13, 'dross',      'Dross',      3),
  (14, 'wyrdling',   'Wyrdling',   2),
  (15, 'lumen',      'Lumen',      3),
  (16, 'gemine',     'Gemine',     4),
  (17, 'morvyne',    'Morvyne',    3),
  (18, 'quillary',   'Quillary',   2),
  (19, 'lupine',     'Lupine',     3),
  (20, 'radiant',    'Radiant',    3),
  (21, 'vespar',     'Vespar',     3),
  (22, 'gehennan',   'Gehennan',   3),
  (23, 'orc',        'Orc',        3),
  (24, 'homunculi',  'Homunculi',  3)
) AS m(old_id, key, new_name, size_id) ON m.old_id = r.id
ON CONFLICT (key) DO UPDATE
  SET name = EXCLUDED.name, size_id = EXCLUDED.size_id, speed = EXCLUDED.speed,
      description = EXCLUDED.description, image = EXCLUDED.image, sort_order = EXCLUDED.sort_order;

-- Step 2: sub-species (gems, breeds, veins) point at their parent
INSERT INTO species (key, name, parent_id, size_id, speed, description, image, sort_order)
SELECT p.key || '_' || replace(sr.slug, '-', '_'), sr.name, p.id, p.size_id, p.speed, sr.description, sr.img_url, sr.id
FROM subraces sr
JOIN races r   ON r.id = sr.race_id
JOIN species p ON p.sort_order = r.id AND p.parent_id IS NULL
ON CONFLICT (key) DO NOTHING;

-- Check it before committing
SELECT s.id, s.key, s.name, sz.name AS size, s.speed, p.name AS parent
FROM species s JOIN sizes sz ON sz.id = s.size_id LEFT JOIN species p ON p.id = s.parent_id
ORDER BY coalesce(p.sort_order, s.sort_order), s.parent_id NULLS FIRST, s.sort_order;

COMMIT;