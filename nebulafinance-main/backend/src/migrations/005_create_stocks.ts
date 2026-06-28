import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../nebula_finance.db');
const db = new Database(dbPath);

console.log('[Migration] Creating stocks and stock_transactions tables...');

try {
    // 1. Stock Holdings Table
    const stocksExist = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='stocks'
    `).get();

    if (stocksExist) {
        console.log('✅ Stocks table already exists');
    } else {
        db.prepare(`
            CREATE TABLE stocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                company_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                purchase_price REAL NOT NULL,
                current_price REAL,
                purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                purchase_transaction_id INTEGER,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (purchase_transaction_id) REFERENCES transactions(id)
            )
        `).run();
        console.log('✅ Stocks table created successfully');
        db.prepare(`CREATE INDEX idx_stocks_user_id ON stocks(user_id)`).run();
        db.prepare(`CREATE INDEX idx_stocks_symbol ON stocks(symbol)`).run();
    }

    // 2. Stock Transactions Table
    const stockTxnsExist = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='stock_transactions'
    `).get();

    if (stockTxnsExist) {
        console.log('✅ Stock transactions table already exists');
    } else {
        db.prepare(`
            CREATE TABLE stock_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                stock_id INTEGER,
                type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
                symbol TEXT NOT NULL,
                company_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                total_amount REAL NOT NULL,
                bank_account_id INTEGER,
                transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (stock_id) REFERENCES stocks(id),
                FOREIGN KEY (bank_account_id) REFERENCES accounts(id)
            )
        `).run();
        console.log('✅ Stock transactions table created successfully');
        db.prepare(`CREATE INDEX idx_stock_transactions_user_id ON stock_transactions(user_id)`).run();
        db.prepare(`CREATE INDEX idx_stock_transactions_stock_id ON stock_transactions(stock_id)`).run();
    }

} catch (error) {
    console.error('❌ Migration failed:', error);
} finally {
    db.close();
}
