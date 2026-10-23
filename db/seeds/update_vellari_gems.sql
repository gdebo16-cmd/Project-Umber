BEGIN;
UPDATE races SET traits = 'Three-tailed fox folk of the Wildlands, quick, curious, and natural trackers. Each Vellari is born into one of eight gem lines, which sets their fur color: Opal (white, the classic look), Onyx (black), Amethyst (purple), Topaz (orange), Quartz (clear crystal), Emerald (green), Ruby (red), or Sapphire (blue).' WHERE name = 'Vellari';
INSERT INTO race_lineage_bonuses (race_id, name, description, skill, bonus, level, action_type, uses, dice)
SELECT r.id, 'Gem Lineage', 'Choose your gem line at character creation. It sets your fur color and gives resistance to one damage type: Opal radiant, Onyx necrotic, Amethyst psychic, Topaz lightning, Quartz force, Emerald poison, Ruby fire, Sapphire cold.', NULL, NULL, 1, NULL, 'Passive', NULL
FROM races r WHERE r.name = 'Vellari'
AND NOT EXISTS (SELECT 1 FROM race_lineage_bonuses b WHERE b.race_id = r.id AND b.name = 'Gem Lineage');
COMMIT;
SELECT b.name, b.level FROM race_lineage_bonuses b JOIN races r ON r.id=b.race_id WHERE r.name='Vellari' ORDER BY b.level, b.id;