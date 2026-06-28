import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../nebula_finance.db');
const db = new Database(dbPath);

console.log('\n========== DATABASE SCHEMA DIAGNOSIS ==========\n');

// Check transactions table
console.log('TRANSACTIONS TABLE:');
try {
    const transactionsSchema = db.prepare('PRAGMA table_info(transactions)').all();
    if (transactionsSchema.length === 0) {
        console.log('❌ Table does not exist');
    } else {
        console.log(transactionsSchema);
    }
} catch (error) {
    console.log('❌ Error checking transactions table:', error);
}

console.log('\n' + '='.repeat(50) + '\n');

// Check if budgets table exists
console.log('BUDGETS TABLE:');
try {
    const budgetsSchema = db.prepare('PRAGMA table_info(budgets)').all();
    if (budgetsSchema.length === 0) {
        console.log('❌ Table does not exist');
    } else {
        console.log(budgetsSchema);
    }
} catch (error) {
    console.log('❌ Table does not exist');
}

console.log('\n' + '='.repeat(50) + '\n');

// Check accounts table (to verify it's working)
console.log('ACCOUNTS TABLE (for reference):');
const accountsSchema = db.prepare('PRAGMA table_info(accounts)').all();
console.log(accountsSchema);

console.log('\n' + '='.repeat(50) + '\n');

// Check stocks table
console.log('STOCKS TABLE:');
try {
    const stocksSchema = db.prepare('PRAGMA table_info(stocks)').all();
    if (stocksSchema.length === 0) {
        console.log('❌ Table does not exist');
    } else {
        console.log(stocksSchema);
    }
} catch (error) {
    console.log('❌ Error checking stocks table:', error);
}

console.log('\n' + '='.repeat(50) + '\n');

// Check stock_transactions table
console.log('STOCK_TRANSACTIONS TABLE:');
try {
    const stockTxnsSchema = db.prepare('PRAGMA table_info(stock_transactions)').all();
    if (stockTxnsSchema.length === 0) {
        console.log('❌ Table does not exist');
    } else {
        console.log(stockTxnsSchema);
    }
} catch (error) {
    console.log('❌ Error checking stock_transactions table:', error);
}

console.log('\n========== END DIAGNOSIS ==========\n');

db.close();
