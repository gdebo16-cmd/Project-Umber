-- Roles: Warrior, Witch, Templar (restructure branch). Descriptions left blank on purpose.
BEGIN;

-- Shared rule: proficiency bonus by level, the same for every role
CREATE TABLE IF NOT EXISTS proficiency_levels (
  level SMALLINT PRIMARY KEY CHECK (level BETWEEN 1 AND 20),
  bonus SMALLINT NOT NULL
);
INSERT INTO proficiency_levels (level, bonus) VALUES
  (1, 2),
  (2, 2),
  (3, 2),
  (4, 2),
  (5, 3),
  (6, 3),
  (7, 3),
  (8, 3),
  (9, 4),
  (10, 4),
  (11, 4),
  (12, 4),
  (13, 5),
  (14, 5),
  (15, 5),
  (16, 5),
  (17, 6),
  (18, 6),
  (19, 6),
  (20, 6)
ON CONFLICT (level) DO UPDATE SET bonus = EXCLUDED.bonus;

CREATE TABLE IF NOT EXISTS roles (
  id           SERIAL PRIMARY KEY,
  key          TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  hit_die      SMALLINT NOT NULL,
  primary_stat TEXT NOT NULL,
  description  TEXT,
  sort_order   SMALLINT
);

CREATE TABLE IF NOT EXISTS role_features (
  role_id    INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  feature_id INT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  level      SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 20),
  rank       SMALLINT NOT NULL DEFAULT 1,
  data       JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (role_id, feature_id, level)
);

INSERT INTO roles (key, name, hit_die, primary_stat, sort_order) VALUES
  ('warrior', 'Warrior', 12, 'Might', 1),
  ('witch', 'Witch', 8, 'Confidence', 2),
  ('templar', 'Templar', 10, 'Judgment', 3)
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, hit_die = EXCLUDED.hit_die, primary_stat = EXCLUDED.primary_stat;

INSERT INTO features (key, name, type) VALUES
  ('preferred_arms', 'Preferred Arms', 'passive'),
  ('draw_breath', 'Draw Breath', 'passive'),
  ('power_of_will', 'Power of Will', 'passive'),
  ('choose_calling', 'Choose Calling', 'passive'),
  ('divine_blessing', 'Divine Blessing', 'passive'),
  ('extra_attack', 'Extra Attack', 'passive'),
  ('calling_feature', 'Calling Feature', 'passive'),
  ('push_onward', 'Push Onward', 'passive'),
  ('sever', 'Sever', 'passive'),
  ('survivor', 'Survivor', 'passive'),
  ('coven_rites', 'Coven Rites', 'passive'),
  ('spellcraft', 'Spellcraft', 'passive'),
  ('cantrips', 'Cantrips', 'passive'),
  ('familiar', 'Familiar', 'passive'),
  ('seance', 'Seance', 'passive'),
  ('spell_carving', 'Spell Carving', 'passive'),
  ('familiars_bite', 'Familiar''s Bite', 'passive'),
  ('grand_coven', 'Grand Coven', 'passive'),
  ('sense_of_the_divine', 'Sense of the Divine', 'passive'),
  ('grace', 'Grace', 'passive'),
  ('divine_arms', 'Divine Arms', 'passive'),
  ('heavenly_strike', 'Heavenly Strike', 'passive'),
  ('angelic_decree', 'Angelic Decree', 'passive'),
  ('heavenly_presence', 'Heavenly Presence', 'passive'),
  ('greater_heavenly_strike', 'Greater Heavenly Strike', 'passive'),
  ('cleansing_grace', 'Cleansing Grace', 'passive'),
  ('grand_order', 'Grand Order', 'passive')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_features (role_id, feature_id, level, rank)
SELECT r.id, f.id, v.level, v.rank
FROM (VALUES
  ('warrior', 'preferred_arms', 1, 1),
  ('warrior', 'draw_breath', 1, 1),
  ('warrior', 'power_of_will', 2, 1),
  ('warrior', 'choose_calling', 3, 1),
  ('warrior', 'divine_blessing', 4, 1),
  ('warrior', 'extra_attack', 5, 2),
  ('warrior', 'draw_breath', 5, 2),
  ('warrior', 'divine_blessing', 6, 1),
  ('warrior', 'calling_feature', 7, 1),
  ('warrior', 'push_onward', 8, 1),
  ('warrior', 'power_of_will', 8, 2),
  ('warrior', 'calling_feature', 9, 1),
  ('warrior', 'divine_blessing', 10, 1),
  ('warrior', 'extra_attack', 11, 3),
  ('warrior', 'divine_blessing', 12, 1),
  ('warrior', 'calling_feature', 13, 1),
  ('warrior', 'sever', 14, 1),
  ('warrior', 'push_onward', 14, 2),
  ('warrior', 'power_of_will', 14, 3),
  ('warrior', 'calling_feature', 15, 1),
  ('warrior', 'divine_blessing', 16, 1),
  ('warrior', 'extra_attack', 17, 4),
  ('warrior', 'power_of_will', 17, 4),
  ('warrior', 'divine_blessing', 18, 1),
  ('warrior', 'calling_feature', 19, 1),
  ('warrior', 'survivor', 20, 1),
  ('warrior', 'sever', 20, 2),
  ('witch', 'coven_rites', 1, 1),
  ('witch', 'spellcraft', 1, 1),
  ('witch', 'cantrips', 1, 2),
  ('witch', 'familiar', 2, 1),
  ('witch', 'choose_calling', 3, 1),
  ('witch', 'divine_blessing', 4, 1),
  ('witch', 'seance', 5, 1),
  ('witch', 'coven_rites', 5, 2),
  ('witch', 'divine_blessing', 6, 1),
  ('witch', 'calling_feature', 7, 1),
  ('witch', 'spell_carving', 8, 1),
  ('witch', 'coven_rites', 8, 3),
  ('witch', 'calling_feature', 9, 1),
  ('witch', 'divine_blessing', 10, 1),
  ('witch', 'seance', 11, 2),
  ('witch', 'spell_carving', 11, 2),
  ('witch', 'divine_blessing', 12, 1),
  ('witch', 'calling_feature', 13, 1),
  ('witch', 'familiar', 14, 2),
  ('witch', 'coven_rites', 14, 4),
  ('witch', 'calling_feature', 15, 1),
  ('witch', 'divine_blessing', 16, 1),
  ('witch', 'familiar', 17, 3),
  ('witch', 'familiars_bite', 17, 1),
  ('witch', 'spell_carving', 17, 3),
  ('witch', 'coven_rites', 17, 5),
  ('witch', 'divine_blessing', 18, 1),
  ('witch', 'calling_feature', 19, 1),
  ('witch', 'grand_coven', 20, 1),
  ('witch', 'seance', 20, 3),
  ('templar', 'sense_of_the_divine', 1, 1),
  ('templar', 'grace', 1, 1),
  ('templar', 'spellcraft', 1, 2),
  ('templar', 'divine_arms', 2, 1),
  ('templar', 'heavenly_strike', 2, 1),
  ('templar', 'choose_calling', 3, 1),
  ('templar', 'divine_blessing', 4, 1),
  ('templar', 'extra_attack', 5, 2),
  ('templar', 'angelic_decree', 5, 1),
  ('templar', 'divine_blessing', 6, 1),
  ('templar', 'calling_feature', 7, 1),
  ('templar', 'heavenly_presence', 8, 1),
  ('templar', 'calling_feature', 9, 1),
  ('templar', 'divine_blessing', 10, 1),
  ('templar', 'extra_attack', 11, 3),
  ('templar', 'greater_heavenly_strike', 11, 1),
  ('templar', 'divine_blessing', 12, 1),
  ('templar', 'calling_feature', 13, 1),
  ('templar', 'heavenly_presence', 14, 2),
  ('templar', 'cleansing_grace', 14, 1),
  ('templar', 'calling_feature', 15, 1),
  ('templar', 'divine_blessing', 16, 1),
  ('templar', 'extra_attack', 17, 4),
  ('templar', 'divine_blessing', 18, 1),
  ('templar', 'calling_feature', 19, 1),
  ('templar', 'heavenly_presence', 20, 3),
  ('templar', 'grand_order', 20, 1)
) AS v(role_key, feature_key, level, rank)
JOIN roles r    ON r.key = v.role_key
JOIN features f ON f.key = v.feature_key
ON CONFLICT DO NOTHING;

-- Spellcraft/Cantrips numbers are settings, not upgrade ranks
UPDATE role_features rf SET rank = 1, data = v.d::jsonb FROM (VALUES
  ('witch','spellcraft','{"slot_table":1}'),
  ('witch','cantrips','{"cantrips":2}'),
  ('templar','spellcraft','{"slot_table":2}')
) AS v(rk,fk,d), roles r, features f
WHERE r.key=v.rk AND f.key=v.fk AND rf.role_id=r.id AND rf.feature_id=f.id;

-- Check
SELECT r.name AS role, rf.level, string_agg(f.name || CASE WHEN rf.rank > 1 THEN ' (' || rf.rank || ')' ELSE '' END, ', ') AS features
FROM role_features rf JOIN roles r ON r.id = rf.role_id JOIN features f ON f.id = rf.feature_id
GROUP BY r.name, r.sort_order, rf.level ORDER BY r.sort_order, rf.level;

COMMIT;
