-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active INTEGER DEFAULT 1,
  preferences TEXT DEFAULT '{"currency":"INR","language":"en","theme":"dark","dateFormat":"DD/MM/YYYY"}'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'credit_card', 'savings', 'investment')),
  balance DECIMAL(15, 2) DEFAULT 0.00,
  color VARCHAR(7) DEFAULT '#6366F1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, icon, color, type, is_default) VALUES
  ('Food & Dining', 'Utensils', '#F59E0B', 'expense', 1),
  ('Transportation', 'Car', '#3B82F6', 'expense', 1),
  ('Bills & Utilities', 'Receipt', '#EF4444', 'expense', 1),
  ('Shopping', 'ShoppingBag', '#8B5CF6', 'expense', 1),
  ('Healthcare', 'Heart', '#EC4899', 'expense', 1),
  ('Entertainment', 'Music', '#14B8A6', 'expense', 1),
  ('Salary', 'Briefcase', '#10B981', 'income', 1),
  ('Freelance', 'Code', '#10B981', 'income', 1),
  ('Others', 'MoreHorizontal', '#6B7280', 'both', 1);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  date DATE NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount DECIMAL(15, 2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);


-- Insights Table
CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('warning', 'info', 'success', 'reminder')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  suggestion TEXT,
  metadata TEXT,
  is_dismissed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_revoked INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Wallets Table (fake-currency bidding)
CREATE TABLE IF NOT EXISTS wallets (
  user_id  INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance  REAL NOT NULL DEFAULT 100000
);

INSERT OR IGNORE INTO wallets (user_id, balance)
SELECT id, 100000 FROM users;

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
  bid_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker_a      TEXT NOT NULL,
  ticker_b      TEXT NOT NULL,
  chosen        TEXT NOT NULL,
  stake         REAL NOT NULL,
  entry_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entry_price_a REAL NOT NULL,
  entry_price_b REAL NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  settle_time   DATETIME,
  exit_price_a  REAL,
  exit_price_b  REAL,
  payout        REAL,
  ret_a         REAL,
  ret_b         REAL
);

CREATE INDEX IF NOT EXISTS idx_bids_status  ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_user    ON bids(user_id);
