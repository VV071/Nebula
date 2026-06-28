import sqlite3 from 'sqlite3';
import path from 'path';

// Note: Using the path to the database in the root of the project
const dbPath = path.join(__dirname, '../../../nebula_finance.db');
const db = new sqlite3.Database(dbPath);

console.log('[DB] Running emergency migration with sqlite3...');

db.serialize(() => {
    // Create budgets table
    db.run(`
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
  `, (err: Error | null) => {
        if (err) {
            console.error('[DB] Error creating budgets table:', err);
            process.exit(1);
        }
        console.log('[DB] ✓ Budgets table ensured');
    });

    // Verify tables exist
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err: Error | null, rows: any[]) => {
        if (err) {
            console.error('[DB] Error listing tables:', err);
            process.exit(1);
        }
        console.log('[DB] Existing tables:', rows.map(t => t.name));
        db.close();
    });
});
