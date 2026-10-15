-- Stage 2 of multi-user campaigns: a short code players type to join.
-- New campaigns get one automatically from the default, so the INSERT doesn't need to send it.
ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS invite_code TEXT NOT NULL
    DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

-- one campaign per code
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_invite_code_key ON campaigns(invite_code);