import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../nebula_finance.db');
const db = new Database(dbPath);

console.log('[Migration] Fixing transactions table schema...');

try {
    // Check if transactions table exists
    const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='transactions'
  `).get();

    if (!tableExists) {
        console.log('Creating transactions table...');

        db.prepare(`
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        category_id INTEGER,
        description TEXT,
        date DATE NOT NULL,
        balance_before REAL DEFAULT 0,
        balance_after REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `).run();

        console.log('✅ Transactions table created');

    } else {
        console.log('Transactions table exists, checking for missing columns...');

        const columns = db.prepare('PRAGMA table_info(transactions)').all();
        const columnNames = columns.map((col: any) => col.name);

        // Check for balance_before
        if (!columnNames.includes('balance_before')) {
            console.log('Adding balance_before column...');
            db.prepare('ALTER TABLE transactions ADD COLUMN balance_before REAL DEFAULT 0').run();
        }

        // Check for balance_after
        if (!columnNames.includes('balance_after')) {
            console.log('Adding balance_after column...');
            db.prepare('ALTER TABLE transactions ADD COLUMN balance_after REAL DEFAULT 0').run();
        }

        console.log('✅ Transactions table updated');
    }

    // Verify final schema
    const finalSchema = db.prepare('PRAGMA table_info(transactions)').all();
    console.log('\nFinal transactions schema:');
    console.table(finalSchema);

} catch (error) {
    console.error('❌ Migration failed:', error);
} finally {
    db.close();
}
