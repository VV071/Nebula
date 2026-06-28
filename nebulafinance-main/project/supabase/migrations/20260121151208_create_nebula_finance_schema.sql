/*
  # Nebula Finance Database Schema
  
  ## Overview
  Complete database schema for Nebula Finance personal finance management application.
  
  ## New Tables
  
  ### 1. accounts
  - `id` (uuid, primary key) - Unique account identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `name` (text) - Account name (e.g., "HDFC Bank")
  - `type` (text) - Account type: bank, cash, credit_card, savings, investment
  - `balance` (decimal) - Current balance
  - `color` (text) - Hex color for UI customization
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. transactions
  - `id` (uuid, primary key) - Unique transaction identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `account_id` (uuid, foreign key) - Links to accounts table
  - `amount` (decimal) - Transaction amount
  - `type` (text) - Transaction type: income or expense
  - `category` (text) - Category identifier (links to categories)
  - `description` (text) - Transaction description
  - `date` (date) - Transaction date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. categories
  - `id` (text, primary key) - Category identifier (e.g., "food")
  - `name` (text) - Display name
  - `icon` (text) - Lucide icon name
  - `color` (text) - Hex color
  - `type` (text) - Category type: expense or income
  - `is_default` (boolean) - Whether it's a default category
  
  ### 4. insights
  - `id` (uuid, primary key) - Unique insight identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `type` (text) - Insight type: warning, reminder, opportunity
  - `title` (text) - Insight headline
  - `message` (text) - Detailed message
  - `suggestion` (text) - Suggested action
  - `dismissed` (boolean) - Whether user dismissed it
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 5. user_settings
  - `user_id` (uuid, primary key) - Links to auth.users
  - `language` (text) - User's language preference (en, hi, ta, te, kn, ml)
  - `theme` (text) - Theme preference: light, dark, auto
  - `currency` (text) - Currency code (INR, USD, EUR)
  - `date_format` (text) - Date format preference
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Categories table is read-only for all authenticated users
*/

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'cash', 'credit_card', 'savings', 'investment')),
  balance decimal(15, 2) NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#4F46E5',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15, 2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default boolean DEFAULT true
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('warning', 'reminder', 'opportunity')),
  title text NOT NULL,
  message text NOT NULL,
  suggestion text DEFAULT '',
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ta', 'te', 'kn', 'ml')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  currency text DEFAULT 'INR',
  date_format text DEFAULT 'DD/MM/YYYY',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_dismissed ON insights(dismissed) WHERE dismissed = false;

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts table
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for categories table (read-only for all)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for insights table
CREATE POLICY "Users can view own insights"
  ON insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_settings table
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (id, name, icon, color, type, is_default) VALUES
  ('food', 'Food & Dining', 'Utensils', '#F59E0B', 'expense', true),
  ('transport', 'Transportation', 'Car', '#3B82F6', 'expense', true),
  ('bills', 'Bills & Utilities', 'Receipt', '#EF4444', 'expense', true),
  ('shopping', 'Shopping', 'ShoppingBag', '#8B5CF6', 'expense', true),
  ('health', 'Healthcare', 'Heart', '#EC4899', 'expense', true),
  ('entertainment', 'Entertainment', 'Music', '#14B8A6', 'expense', true),
  ('education', 'Education', 'BookOpen', '#6366F1', 'expense', true),
  ('salary', 'Salary', 'Briefcase', '#10B981', 'income', true),
  ('freelance', 'Freelance', 'Code', '#10B981', 'income', true),
  ('investment', 'Investment Return', 'TrendingUp', '#10B981', 'income', true),
  ('other', 'Others', 'MoreHorizontal', '#6B7280', 'both', true)
ON CONFLICT (id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
