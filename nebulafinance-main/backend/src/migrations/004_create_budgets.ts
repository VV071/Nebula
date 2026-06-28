import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../nebula_finance.db');
const db = new Database(dbPath);

console.log('[Migration] Creating budgets table...');

try {
    // Check if budgets table exists
    const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='budgets'
  `).get();

    if (tableExists) {
        console.log('✅ Budgets table already exists');
    } else {
        db.prepare(`
      CREATE TABLE budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL CHECK(period IN ('monthly', 'yearly')),
        start_date DATE,
        end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `).run();

        console.log('✅ Budgets table created successfully');
    }

    // Verify
    const schema = db.prepare('PRAGMA table_info(budgets)').all();
    console.log('\nBudgets table schema:');
    console.table(schema);

} catch (error) {
    console.error('❌ Migration failed:', error);
} finally {
    db.close();
}
