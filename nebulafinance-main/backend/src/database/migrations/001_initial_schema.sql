-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{
    "currency": "INR",
    "language": "en",
    "theme": "dark",
    "dateFormat": "DD/MM/YYYY"
  }'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'credit_card', 'savings', 'investment')),
  balance DECIMAL(15, 2) DEFAULT 0.00,
  color VARCHAR(7) DEFAULT '#6366F1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Insert default categories
INSERT INTO categories (name, icon, color, type, is_default) VALUES
  ('Food & Dining', 'Utensils', '#F59E0B', 'expense', TRUE),
  ('Transportation', 'Car', '#3B82F6', 'expense', TRUE),
  ('Bills & Utilities', 'Receipt', '#EF4444', 'expense', TRUE),
  ('Shopping', 'ShoppingBag', '#8B5CF6', 'expense', TRUE),
  ('Healthcare', 'Heart', '#EC4899', 'expense', TRUE),
  ('Entertainment', 'Music', '#14B8A6', 'expense', TRUE),
  ('Salary', 'Briefcase', '#10B981', 'income', TRUE),
  ('Freelance', 'Code', '#10B981', 'income', TRUE),
  ('Others', 'MoreHorizontal', '#6B7280', 'both', TRUE)
ON CONFLICT DO NOTHING;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Insights Table
CREATE TABLE IF NOT EXISTS insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('warning', 'info', 'success', 'reminder')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  suggestion TEXT,
  metadata JSONB,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
