-- SME Cash-Flow Risk Copilot — SQLite schema
-- Every SME invoice is a risky asset: a promise of future money with an
-- uncertain arrival date and a real default risk.

-- Users Table (permissive demo auth: user 1 is auto-created)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT,              -- used for the news-based risk signal
  contact_info TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,                                  -- null if unpaid
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
  risk_score REAL,                                 -- computed by risk_engine.py
  risk_components TEXT,                            -- JSON: component scores + weights
  source_document TEXT,                            -- original uploaded/pasted text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Payment History Table (actual - due, negative if early)
CREATE TABLE IF NOT EXISTS payment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  days_late INTEGER NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_history_client_id ON payment_history(client_id);

-- Default demo identity so the app works with zero setup
INSERT OR IGNORE INTO users (id, email, name) VALUES (1, 'demo@smecopilot.local', 'Demo Owner');
INSERT OR IGNORE INTO businesses (id, user_id, name)
SELECT 1, 1, 'My Business'
WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE id = 1);
