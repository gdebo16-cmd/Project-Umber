-- 12_calling_rename_remap.sql
-- Remap characters from legacy subclass names to pack calling keys.
-- Rename pack calling dark_order -> order_of_the_shade (matches content pack / sandbox).
-- Rename feature key avenger display name to Dark Order.
-- Idempotent. Run after 06 / 10b / 11.

BEGIN;

-- Calling rename: Dark Order (key dark_order from 05) -> Order of the Shade
UPDATE callings
SET key = 'order_of_the_shade',
    name = 'Order of the Shade'
WHERE key = 'dark_order'
  AND NOT EXISTS (SELECT 1 FROM callings c2 WHERE c2.key = 'order_of_the_shade');

-- Pack rename map: old sub_classes.name -> callings.key
UPDATE characters ch
SET calling_id = ca.id
FROM sub_classes sc
JOIN (VALUES
  ('Oath of Shadows', 'order_of_the_shade'),
  ('Way of the Bear', 'tranquil_fist'),
  ('Rune Weaver', 'tome_of_inscription'),
  ('Shadowblade', 'art_of_the_ghost'),
  ('Skyreach', 'dance_of_the_eagle'),
  ('Evoker', 'tome_of_evocation'),
  ('Rite of the Seraph', 'seal_of_the_seraphim'),
  ('Witch Knight', 'hex_magic')
) AS map(subclass_name, calling_key) ON lower(sc.name) = lower(map.subclass_name)
JOIN callings ca ON ca.key = map.calling_key
WHERE sc.id = ch.subclass_id;

-- Joof (and any Mage with null subclass + Mage role): Tome of Evocation
UPDATE characters ch
SET calling_id = ca.id
FROM roles ro
JOIN callings ca ON ca.role_id = ro.id AND ca.key = 'tome_of_evocation'
WHERE ch.role_id = ro.id
  AND lower(ro.name) = 'mage'
  AND ch.subclass_id IS NULL;

-- Feature key avenger display name -> Dark Order
UPDATE features
SET name = 'Dark Order'
WHERE key = 'avenger'
  AND name IS DISTINCT FROM 'Dark Order';

COMMIT;
