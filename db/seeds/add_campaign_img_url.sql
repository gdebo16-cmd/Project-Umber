-- Picture for each campaign (a path like /campaigns/foo.png); NULL until one is set.
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_img_url TEXT;
