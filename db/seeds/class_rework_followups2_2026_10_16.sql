-- Rework follow-ups 2 (Gabriel 2026-10-16): +1 blessings record their score; swap-rule tracking. Idempotent.
BEGIN;
-- +1 blessings carry the score in the option: Iron Resolve (any score), Keen Wits (INT/WIS/CHA). Second Breath is always CON.
UPDATE class_features SET options = ARRAY['+2 STR','+2 DEX','+2 CON','+2 INT','+2 WIS','+2 CHA','Hearthblood','Steady Bulwark','Swiftfoot','Mender''s Touch','Warding Word','Second Breath','Kindred Rally','Iron Resolve (+1 STR)','Iron Resolve (+1 DEX)','Iron Resolve (+1 CON)','Iron Resolve (+1 INT)','Iron Resolve (+1 WIS)','Iron Resolve (+1 CHA)','Unshaken','Heavy Hand','Deadeye Draw','Twin Fangs','Spell Edge','Elemental Bite','Crushing Momentum','Finishing Blow','Bleeding Cut','Overwhelm','Night-Eyed','Keen Wits (+1 INT)','Keen Wits (+1 WIS)','Keen Wits (+1 CHA)','Ever-Watchful','Silver Tongue','Gravecaller','Death''s Margin','Many Faces','Trickster''s Feint','Veilsight','Kept boost (already in scores)'] WHERE name = 'Ability Boost' AND feature_type = 'boost';
-- Swap rule: one pool swap per level gained. Existing characters start at their current level.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS last_swap_level INTEGER;
UPDATE characters SET last_swap_level = level WHERE last_swap_level IS NULL;
COMMIT;
SELECT (SELECT count(*) FROM class_features WHERE name = 'Ability Boost' AND cardinality(options) = 41) AS boost_rows,
       (SELECT count(*) FROM characters WHERE last_swap_level IS NULL) AS unset;
