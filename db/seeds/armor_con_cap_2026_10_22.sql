-- Rename armor.dex_cap -> con_cap (the cap now applies to the CON mod). Idempotent.
-- Run BEFORE re-running armor_batch_2026_10_22.sql, which now uses con_cap.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='armor' AND column_name='dex_cap')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='armor' AND column_name='con_cap') THEN
    ALTER TABLE armor RENAME COLUMN dex_cap TO con_cap;
  END IF;
END $$;
