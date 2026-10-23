-- Items (potions, spell scrolls, magical and common items) + character ownership. Idempotent, no data rows.
BEGIN;
CREATE TABLE IF NOT EXISTS items (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  item_category text NOT NULL CONSTRAINT items_category_check
                CHECK (item_category IN ('potion','spell_scroll','magical_item','common_item')),
  rarity        text NOT NULL CONSTRAINT items_rarity_check
                CHECK (rarity IN ('Common','Magical','Arcane','Mythical','Object of Power')),
  description   text,
  -- array of {name,text,bonus_dice,damage_type,to_hit_bonus,ac_bonus,resist[],uses,recharge,action_type}
  effects       jsonb NULL CONSTRAINT items_effects_array_check CHECK (effects IS NULL OR jsonb_typeof(effects) = 'array'),
  consumable    boolean NOT NULL DEFAULT false,
  uses          int NULL,
  recharge      text NULL,
  spell_id      int NULL REFERENCES spells(id) ON DELETE SET NULL,
  weight_lb     numeric NULL,
  CONSTRAINT items_common_item_rarity_check CHECK (item_category <> 'common_item' OR rarity = 'Common')
);
CREATE UNIQUE INDEX IF NOT EXISTS items_name_lower_key ON items (lower(name));

CREATE TABLE IF NOT EXISTS character_items (
  id           serial PRIMARY KEY,
  character_id int NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_id      int NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity     int NOT NULL DEFAULT 1 CONSTRAINT character_items_quantity_check CHECK (quantity >= 0),
  is_equipped  boolean NOT NULL DEFAULT false,
  CONSTRAINT character_items_character_id_item_id_key UNIQUE (character_id, item_id)
);
COMMIT;
