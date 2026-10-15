-- Stage 1 of multi-user campaigns: who is in each campaign, and as what.
CREATE TABLE IF NOT EXISTS campaign_members (
    id           SERIAL PRIMARY KEY,
    campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('dm', 'player')),
    character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS campaign_members_user_id_idx ON campaign_members(user_id);

-- existing campaigns: their creator becomes the DM
INSERT INTO campaign_members (campaign_id, user_id, role)
SELECT id, user_id, 'dm' FROM campaigns
ON CONFLICT (campaign_id, user_id) DO NOTHING;