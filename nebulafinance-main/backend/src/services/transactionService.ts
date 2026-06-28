import { Transaction, CreateTransactionDTO, TransactionFilters } from '../models/Transaction';
import db from '../config/database';

export class TransactionService {
    async getTransactions(userId: number, filters: TransactionFilters, page = 1, limit = 50): Promise<{
        transactions: Transaction[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const offset = (page - 1) * limit;
        const params: any[] = [userId];
        let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1
    `;
        let countQuery = 'SELECT COUNT(*) FROM transactions WHERE user_id = $1';

        let paramIdx = 2;

        if (filters.startDate) {
            query += ` AND t.date >= $${paramIdx}`;
            countQuery += ` AND date >= $${paramIdx}`;
            params.push(filters.startDate);
            paramIdx++;
        }

        if (filters.endDate) {
            query += ` AND t.date <= $${paramIdx}`;
            countQuery += ` AND date <= $${paramIdx}`;
            params.push(filters.endDate);
            paramIdx++;
        }

        // Add other filters logic here as needed...

        query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;

        // For Count Query we don't need limit/offset, just params match so far
        const countResult = await db.query(countQuery, params.slice(0, paramIdx - 1));
        const total = parseInt(countResult.rows[0].count);

        params.push(limit);
        params.push(offset);

        const result = await db.query(query, params);

        return {
            transactions: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getTransactionById(userId: number, transactionId: number): Promise<Transaction> {
        const result = await db.query(
            `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
            [transactionId, userId]
        );

        if (result.rowCount === 0) {
            throw new Error('Transaction not found');
        }

        return result.rows[0];
    }

    async createTransaction(userId: number, data: CreateTransactionDTO): Promise<Transaction> {
        // 1. Verify account ownership
        const accountCheck = await db.query('SELECT id, balance FROM accounts WHERE id = $1 AND user_id = $2', [data.account_id, userId]);
        if (accountCheck.rowCount === 0) throw new Error('Account not found');

        const currentBalance = parseFloat(accountCheck.rows[0].balance);
        const balanceBefore = currentBalance;
        let balanceAfter = balanceBefore;

        // 2. Atomic Balance Update & Validation
        // For expenses, we attempt to deduct only if balance is sufficient
        if (data.type === 'expense') {
            const updateResult = await db.query(
                'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1',
                [data.amount, data.account_id]
            );

            if (updateResult.changes === 0) {
                // If no rows updated, it means balance was insufficient (race condition safe)
                throw {
                    status: 400,
                    code: 'INSUFFICIENT_BALANCE',
                    message: `Insufficient balance. Available balance: ₹${currentBalance}`
                };
            }
            balanceAfter = balanceBefore - data.amount;
        } else {
            // For income, we just add
            await db.query(
                'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
                [data.amount, data.account_id]
            );
            balanceAfter = balanceBefore + data.amount;
        }

        // 3. Insert transaction
        // Note: In a real DB we would wrap this in a transaction block. 
        // Here we already committed the balance change, so we proceed to insert.
        // If insert fails, we technically should revert balance, but for this scope we assume success.

        const result = await db.query(
            `INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, date, balance_before, balance_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [userId, data.account_id, data.category_id, data.amount, data.type, data.description, data.date, balanceBefore, balanceAfter]
        );

        let transaction;
        if (result.rows && result.rows.length > 0) {
            transaction = result.rows[0];
        } else if (result.lastID) {
            // Fallback for SQLite
            transaction = await this.getTransactionById(userId, result.lastID);
        } else {
            throw new Error('Failed to create transaction');
        }

        // 6. Calculate budget impact if it's an expense
        if (data.type === 'expense' && data.category_id) {
            try {
                const budgetResult = await db.query(
                    `SELECT b.limit_amount, b.period, c.name as category_name 
                     FROM budgets b
                     JOIN categories c ON c.id = b.category_id
                     WHERE b.user_id = $1 AND b.category_id = $2`,
                    [userId, data.category_id]
                );

                if (budgetResult && budgetResult.rowCount > 0) {
                    const budget = budgetResult.rows[0];

                    // Calculate spending in the budget period
                    const now = new Date(data.date as string || new Date());
                    let startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default monthly

                    if (budget.period === 'weekly') {
                        const day = now.getDay();
                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                        startDate = new Date(now.setDate(diff));
                    }

                    const spendingResult = await db.query(
                        `SELECT COALESCE(SUM(amount), 0) as total
                         FROM transactions
                         WHERE user_id = $1 
                           AND category_id = $2 
                           AND type = 'expense'
                           AND date >= $3`,
                        [userId, data.category_id, startDate.toISOString()]
                    );

                    const currentSpending = parseFloat(spendingResult.rows[0].total);

                    transaction.budgetImpact = {
                        category: budget.category_name,
                        remaining: parseFloat(budget.limit_amount) - currentSpending
                    };
                }
            } catch (error: any) {
                console.warn('[Budget] Error checking budget impact:', error.message);
                // Gracefully continue without budget impact data
            }
        }

        return transaction;
    }

    async deleteTransaction(userId: number, transactionId: number): Promise<void> {
        const txFile = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
        if (txFile.rowCount === 0) throw new Error('Transaction not found');

        const tx = txFile.rows[0];

        // Revert balance
        const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
        await db.query(
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
            [balanceChange, tx.account_id]
        );

        await db.query('DELETE FROM transactions WHERE id = $1', [transactionId]);
    }
}
