-- 13_soul_link_rename.sql
-- Rename Reaver signature cantrip Soulbrand (id 798) -> Soul Link; reword brand/branded -> link/linked.
-- Idempotent: safe to re-run (matches id 798 or legacy name Soulbrand).
-- Does not touch the Soul Brand weapon feature (features.soul_brand / character_weapons.soul_branded).

UPDATE spells
SET name = 'Soul Link',
    base_description = 'Reaver signature cantrip. You link one creature you can see within 60 ft (10 rounds in combat, 1 hour out of combat; no attack or save to place). The first time you hit it with a weapon attack on each of your turns, it takes an extra 1d6 necrotic (1d8 at L5, 1d10 at L11, 2d6 at L17). You have advantage on checks to track or find it. If it drops to 0 HP before the spell ends, you can use a bonus action on a later turn to move the link to a new creature you can see within 60 ft. Only one link at a time; casting it again ends the old one. When you place or move the link, choose one. Weaken: the linked creature subtracts 1d4 from its first attack roll each turn against anyone but you. Strengthen: you gain temporary HP equal to your Confidence modifier (minimum 1) each time the extra damage triggers.'
WHERE id = 798 OR name = 'Soulbrand';