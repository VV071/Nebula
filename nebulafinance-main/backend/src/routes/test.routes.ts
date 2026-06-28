import { Router, Request, Response } from 'express';
import db from '../config/database';

const router = Router();

// 1.1 Health Check
router.get('/health', async (req: Request, res: Response) => {
    try {
        console.log('[TEST] Health check requested');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            server: 'running'
        });
    } catch (error: any) {
        console.error('[TEST] Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 1.2 Database Test
router.get('/test/db', async (req: Request, res: Response) => {
    try {
        console.log('[TEST] Database test requested');

        // Get list of tables
        const tablesResult = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const tables = tablesResult.rows.map((r: any) => r.name);

        // Get counts for some tables if they exist
        const sampleData: any = {};
        if (tables.includes('accounts')) {
            const accCount = await db.query("SELECT COUNT(*) as count FROM accounts");
            sampleData.accounts = accCount.rows[0].count;
        }
        if (tables.includes('transactions')) {
            const txCount = await db.query("SELECT COUNT(*) as count FROM transactions");
            sampleData.transactions = txCount.rows[0].count;
        }

        res.json({
            status: 'ok',
            tables,
            sampleData
        });
    } catch (error: any) {
        console.error('[TEST] Database test failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 1.3 Get Test Transactions
router.get('/test/transactions', async (req: Request, res: Response) => {
    try {
        console.log('[TEST] Last 5 transactions requested');

        const result = await db.query("SELECT * FROM transactions ORDER BY date DESC LIMIT 5");

        res.json({
            status: 'ok',
            count: result.rows.length,
            transactions: result.rows
        });
    } catch (error: any) {
        console.error('[TEST] Fetch transactions failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 1.4 Create Test Transaction
router.post('/test/transaction', async (req: Request, res: Response) => {
    try {
        const { type, amount, description } = req.body;
        console.log('[TEST] Creating test transaction:', { type, amount });

        // Get default user and account
        const accountsResult = await db.query("SELECT id, user_id FROM accounts LIMIT 1");
        if (accountsResult.rows.length === 0) {
            throw new Error('No accounts found. Please seed the database first.');
        }

        const { id: account_id, user_id } = accountsResult.rows[0];

        // Get a valid category_id
        const categoriesResult = await db.query("SELECT id FROM categories LIMIT 1");
        if (categoriesResult.rows.length === 0) {
            throw new Error('No categories found. Please seed the database first.');
        }
        const category_id = categoriesResult.rows[0].id;

        const date = new Date().toISOString().split('T')[0];

        const query = `
            INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const params = [user_id, account_id, category_id, amount, type, description || 'API test transaction', date];

        await db.query(query, params);

        res.json({
            status: 'ok',
            message: 'Transaction created successfully'
        });
    } catch (error: any) {
        console.error('[TEST] Create transaction failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
