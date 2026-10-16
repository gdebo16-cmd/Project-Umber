-- Lupine breed art (locked by Gabriel 2026-10-16). Safe to re-run.
UPDATE subraces s SET img_url = '/races/lupine-' || s.slug || '.png'
FROM races r WHERE r.id = s.race_id AND r.name = 'Lupine'
  AND s.slug IN ('rottweiler','mastiff','greyhound','husky','shepherd','bloodhound');
SELECT s.name, s.img_url FROM subraces s JOIN races r ON r.id = s.race_id WHERE r.name = 'Lupine' ORDER BY s.id;