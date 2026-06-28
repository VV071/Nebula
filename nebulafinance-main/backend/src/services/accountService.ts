import { Account, CreateAccountDTO, UpdateAccountDTO } from '../models/Account';
import db from '../config/database';

export class AccountService {
    async getUserAccounts(userId: number): Promise<Account[]> {
        console.log(`[AccountService] Fetching accounts for user: ${userId}`);
        const result = await db.query(
            'SELECT * FROM accounts WHERE user_id = $1 AND is_active = 1 ORDER BY created_at DESC',
            [userId]
        );
        console.log(`[AccountService] Found ${result.rowCount} accounts`);
        return result.rows;
    }

    async getAccountById(userId: number, accountId: number): Promise<Account> {
        const result = await db.query(
            'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
            [accountId, userId]
        );

        if (result.rowCount === 0) {
            throw new Error('Account not found');
        }

        return result.rows[0];
    }

    async createAccount(userId: number, data: CreateAccountDTO): Promise<Account> {
        const result = await db.query(
            `INSERT INTO accounts (user_id, name, type, balance, color) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, data.name, data.type, data.balance || 0, data.color || '#6366F1']
        );

        if (result.rows && result.rows.length > 0) {
            return result.rows[0];
        }

        // Fallback for SQLite which doesn't support RETURNING *
        if (result.lastID) {
            return this.getAccountById(userId, result.lastID);
        }

        throw new Error('Failed to create account');
    }

    async updateAccount(userId: number, accountId: number, data: UpdateAccountDTO): Promise<Account> {
        const account = await this.getAccountById(userId, accountId);

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${idx}`);
                values.push(value);
                idx++;
            }
        });

        if (fields.length === 0) return account;

        values.push(accountId);
        values.push(userId); // Ensure ownership

        const result = await db.query(
            `UPDATE accounts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
            values
        );

        if (result.rows && result.rows.length > 0) {
            return result.rows[0];
        }

        // Fallback for SQLite
        return this.getAccountById(userId, accountId);
    }

    async deleteAccount(userId: number, accountId: number): Promise<void> {
        await this.getAccountById(userId, accountId);

        // Check for transactions
        const txCheck = await db.query('SELECT id FROM transactions WHERE account_id = $1 LIMIT 1', [accountId]);

        if (txCheck.rowCount > 0) {
            // Soft delete
            await db.query('UPDATE accounts SET is_active = 0 WHERE id = $1', [accountId]);
        } else {
            // Hard delete
            await db.query('DELETE FROM accounts WHERE id = $1', [accountId]);
        }
    }

    async getBalanceHistory(userId: number, accountId: number): Promise<any[]> {
        await this.getAccountById(userId, accountId);
        // Placeholder for history logic, for now returning empty or simple aggregation if needed.
        // In a real app, this would query transactions and aggregate daily.
        return [];
    }
}
