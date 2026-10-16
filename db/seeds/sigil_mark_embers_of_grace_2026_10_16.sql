-- Gabriel locked 2026-10-16 (changes-for-major.md sections 7 and 8, renames-for-major.md #11, 15-gracewraith.md). Idempotent.
-- (1) Sigil blade becomes a sigil mark on one owned weapon (characters.sigil_item_id). Owned sigil blades become a marked Rapier of the same +N.
-- (2) Radiance resource -> Embers of Grace (units "embers"): columns and feature text (also renames an earlier local Grace points draft). The radiant damage type and the feature name "Stolen Radiance" stay.
BEGIN;

-- ---------- (2) column renames (values are kept) ----------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      ('classes','has_radiance','has_embers'), ('classes','has_grace','has_embers'),
      ('sub_classes','breach_drains_radiance','breach_drains_embers'), ('sub_classes','breach_drains_grace','breach_drains_embers'),
      ('class_features','radiance_cost','ember_cost'), ('class_features','grace_cost','ember_cost'),
      ('class_features','radiance_per_die','embers_per_die'), ('class_features','grace_per_die','embers_per_die'),
      ('subclass_features','radiance_cost','ember_cost'), ('subclass_features','grace_cost','ember_cost'),
      ('subclass_features','radiance_per_die','embers_per_die'), ('subclass_features','grace_per_die','embers_per_die'),
      ('characters','radiance_spent','embers_spent'), ('characters','grace_spent','embers_spent')) v(t, o, n)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = r.t AND column_name = r.o) THEN
      EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r.t, r.o, r.n);
    END IF;
  END LOOP;
END $$;

-- feature text: Radiance (or the earlier local "GP" draft) -> Embers of Grace / embers. Not "Stolen Radiance", not "radiant".
CREATE OR REPLACE FUNCTION pg_temp.embers(t TEXT) RETURNS TEXT LANGUAGE sql AS $f$
  SELECT regexp_replace(regexp_replace(regexp_replace(regexp_replace(t,
    '\m(Radiance|Grace) pool\M', 'Embers of Grace', 'g'),
    '\m1 (Radiance|GP)\M', '1 ember', 'g'),
    '\m(\d+) (Radiance|GP)\M', '\1 embers', 'g'),
    '(?<!Stolen )\m(Radiance|GP)\M', 'embers', 'g')
$f$;
UPDATE class_features SET description = pg_temp.embers(description) WHERE description ~ '(?<!Stolen )\m(Radiance|GP)\M';
UPDATE subclass_features SET description = pg_temp.embers(description) WHERE description ~ '(?<!Stolen )\m(Radiance|GP)\M';
UPDATE class_features SET uses = pg_temp.embers(uses) WHERE uses ~ '(?<!Stolen )\m(Radiance|GP)\M';
UPDATE subclass_features SET uses = pg_temp.embers(uses) WHERE uses ~ '(?<!Stolen )\m(Radiance|GP)\M';
UPDATE sub_classes SET breach_effect = pg_temp.embers(breach_effect) WHERE breach_effect ~ '(?<!Stolen )\m(Radiance|GP)\M';
UPDATE class_feature_options SET description = pg_temp.embers(description) WHERE description ~ '(?<!Stolen )\m(Radiance|GP)\M';

-- ---------- (1) sigil mark ----------
ALTER TABLE characters ADD COLUMN IF NOT EXISTS sigil_item_id INT REFERENCES character_weapons(id) ON DELETE SET NULL;

-- owned sigil blades -> Rapier of the same +N (Elegant One-Handed, 1d8, finesse); that row becomes the marked weapon
-- a character who already owns that Rapier: the existing Rapier gets the mark and the sigil blade row is dropped
UPDATE characters ch SET sigil_item_id = x.id
  FROM character_weapons sbr JOIN weapons sb ON sb.id = sbr.weapon_id
  JOIN weapons rp ON rp.name = regexp_replace(sb.name, '^Sigil Blade', 'Rapier')
  JOIN character_weapons x ON x.weapon_id = rp.id AND x.character_id = sbr.character_id
 WHERE sb.name ~ '^Sigil Blade( \+\d+)?$' AND ch.id = sbr.character_id AND ch.sigil_item_id IS NULL;
WITH moved AS (
  UPDATE character_weapons cw SET weapon_id = rp.id
    FROM weapons sb, weapons rp
   WHERE sb.id = cw.weapon_id AND sb.name ~ '^Sigil Blade( \+\d+)?$'
     AND rp.name = regexp_replace(sb.name, '^Sigil Blade', 'Rapier')
     AND NOT EXISTS (SELECT 1 FROM character_weapons x WHERE x.character_id = cw.character_id AND x.weapon_id = rp.id)
  RETURNING cw.character_id, cw.id)
UPDATE characters ch SET sigil_item_id = moved.id FROM moved WHERE ch.id = moved.character_id AND ch.sigil_item_id IS NULL;
DELETE FROM character_weapons cw USING weapons sb WHERE sb.id = cw.weapon_id AND sb.name ~ '^Sigil Blade( \+\d+)?$';
DELETE FROM weapons WHERE name ~ '^Sigil Blade( \+\d+)?$';

UPDATE class_features SET name = 'Sigil Mark', uses = '1 mark at a time', description =
 'The sigil blade is no longer a weapon: it is a sigil mark you place on one weapon you own (tick Sigil mark on the weapon), one at a time. Marking takes 10 minutes of tracing the sigil (can be done during a short or long rest); placing a new mark ends the old one at once. You can use INT instead of STR or DEX for attack and damage rolls with the marked weapon. The marked weapon counts as a "sigil blade" for every feature (Sigil Strike, the Crack radiant bonus, Grace Leech). It is not a focus. The mark can go on any weapon you''re proficient with (Minor, Elegant One-Handed, Broad One-Handed).'
 WHERE class_id = (SELECT id FROM classes WHERE name = 'Gracewraith') AND name IN ('Sigil Blade', 'Sigil Mark') AND level = 1;

INSERT INTO class_features (class_id, level, name, description, feature_type, source, sort_order, action_type, uses)
SELECT c.id, 1, v.name, v.description, 'feature', 'approved', v.sort_order, v.action_type, v.uses
  FROM classes c, (VALUES
   ('Hallowed Edge', 'Your marked weapon sheds dim light 10 ft (on or off at will). Once per turn when you hit with it while you have 1+ Crack, you can make the hit''s weapon damage radiant instead of its normal type.', 5, NULL, 'Passive; once per turn'),
   ('Lightfall Recall', 'Bonus action: if your marked weapon is within 60 ft and not held by another creature, it dissolves into light and reforms in your hand; each creature within 5 ft of where it was takes radiant damage equal to your Crack count (0 at 0 Cracks). You can''t recall it from a creature''s grip or from beyond 60 ft.', 6, 'bonus', 'At will')
  ) v(name, description, sort_order, action_type, uses)
 WHERE c.name = 'Gracewraith'
   AND NOT EXISTS (SELECT 1 FROM class_features f WHERE f.class_id = c.id AND f.name = v.name);
-- grammar + leftover sigil blade wording
UPDATE class_features SET description = replace(description, 'a Embers of Grace of', 'Embers of Grace equal to') WHERE description LIKE '%a Embers of Grace of%';
UPDATE subclass_features SET description = replace(description, 'a Embers of Grace of', 'Embers of Grace equal to') WHERE description LIKE '%a Embers of Grace of%';
UPDATE class_features SET description = regexp_replace(description, '\msigil blade\M', 'sigil-marked weapon', 'gi') WHERE description ~* '\msigil blade\M' AND name <> 'Sigil Mark';
UPDATE subclass_features SET description = regexp_replace(description, '\msigil blade\M', 'sigil-marked weapon', 'gi') WHERE description ~* '\msigil blade\M';

COMMIT;
