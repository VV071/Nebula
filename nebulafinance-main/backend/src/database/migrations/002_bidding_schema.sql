-- Wallet: one row per user, created on first use via place_bid
CREATE TABLE IF NOT EXISTS wallets (
  user_id  INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance  NUMERIC NOT NULL DEFAULT 100000
);

-- Seed existing users so they already have wallets
INSERT INTO wallets (user_id, balance)
SELECT id, 100000 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  bid_id        SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker_a      TEXT NOT NULL,
  ticker_b      TEXT NOT NULL,
  chosen        TEXT NOT NULL,
  stake         NUMERIC NOT NULL,
  entry_time    TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_price_a NUMERIC NOT NULL,
  entry_price_b NUMERIC NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | won | lost | void
  settle_time   TIMESTAMPTZ,
  exit_price_a  NUMERIC,
  exit_price_b  NUMERIC,
  payout        NUMERIC,
  ret_a         NUMERIC,
  ret_b         NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_user   ON bids(user_id);
