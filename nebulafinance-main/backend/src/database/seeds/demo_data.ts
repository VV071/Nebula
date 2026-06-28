import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });
import db from '../../config/database';

const seed = async () => {
    console.log('Seeding database...');
    try {
        // 1. Create Demo User
        const email = 'demo@nebulafinance.com';
        const password = await bcrypt.hash('Demo@123', 10);

        // Check if user exists
        const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rowCount > 0) {
            console.log('Demo user already exists. Skipping seed.');
            return;
        }

        const userResult = await db.query(
            `INSERT INTO users (email, password_hash, name, preferences) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
            [
                email,
                password,
                'Demo User',
                JSON.stringify({
                    currency: 'INR',
                    language: 'en',
                    theme: 'dark',
                    dateFormat: 'DD/MM/YYYY'
                })
            ]
        );
        const userId = userResult.rows[0].id;
        console.log(`Created demo user with ID: ${userId}`);

        // 2. Create Accounts
        const accounts = [
            { name: 'HDFC Bank', type: 'bank', balance: 45000.00, color: '#4F46E5' },
            { name: 'Cash Wallet', type: 'cash', balance: 2500.00, color: '#10B981' },
            { name: 'SBI Credit Card', type: 'credit_card', balance: -15000.00, color: '#EF4444' }
        ];

        for (const acc of accounts) {
            await db.query(
                `INSERT INTO accounts (user_id, name, type, balance, color) 
         VALUES ($1, $2, $3, $4, $5)`,
                [userId, acc.name, acc.type, acc.balance, acc.color]
            );
        }
        console.log('Created accounts');

        // 3. Transactions (Sample)
        // We need category IDs first
        const categoriesResult = await db.query('SELECT id, name, type FROM categories');
        const categories = categoriesResult.rows;

        const foodCat = categories.find((c: any) => c.name === 'Food & Dining')?.id;
        const salaryCat = categories.find((c: any) => c.name === 'Salary')?.id;

        // Get account IDs
        const accountsResult = await db.query('SELECT id, name FROM accounts WHERE user_id = $1', [userId]);
        const bankAcc = accountsResult.rows.find((a: any) => a.name === 'HDFC Bank')?.id;

        if (bankAcc && salaryCat) {
            await db.query(
                `INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, bankAcc, salaryCat, 85000.00, 'income', 'January Salary', new Date()]
            );
        }

        console.log('Seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
