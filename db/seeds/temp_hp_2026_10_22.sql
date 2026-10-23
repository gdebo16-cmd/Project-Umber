-- Temporary HP (Quench, Reseal, Bark Ward, etc.): damage comes off this first; doesn't stack; long rest clears it
ALTER TABLE characters ADD COLUMN IF NOT EXISTS temp_hp int NOT NULL DEFAULT 0;
