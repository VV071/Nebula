import { Budget, CreateBudgetDTO, UpdateBudgetDTO, BudgetWithSpending } from '../models/Budget';
import db from '../config/database';

export class BudgetService {
    /**
     * Get all budgets for a user with current spending calculations
     */
    async getBudgets(userId: number): Promise<BudgetWithSpending[]> {
        // Fetch all budgets for user
        const result = await db.query(
            `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [userId]
        );

        const budgets = result.rows;

        // Calculate current spending for each budget
        const enrichedBudgets = await Promise.all(
            budgets.map(async (budget: any) => {
                const spent = await this.calculateCategorySpending(
                    userId,
                    budget.category_id,
                    this.getCurrentPeriodStart(budget.period),
                    new Date()
                );

                const remaining = budget.limit_amount - spent;
                const percentUsed = (spent / budget.limit_amount) * 100;

                return {
                    ...budget,
                    spent,
                    remaining,
                    percentUsed
                };
            })
        );

        return enrichedBudgets;
    }

    async getBudgetById(userId: number, id: number): Promise<Budget> {
        const result = await db.query(
            `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             WHERE b.id = $1 AND b.user_id = $2`,
            [id, userId]
        );

        if (result.rowCount === 0) {
            throw new Error('Budget not found');
        }

        return result.rows[0];
    }

    /**
     * Create or update a budget
     */
    async createBudget(userId: number, data: CreateBudgetDTO): Promise<Budget> {
        // Check if budget already exists for this category
        const existing = await db.query(
            'SELECT id FROM budgets WHERE user_id = $1 AND category_id = $2',
            [userId, data.category_id]
        );

        if (existing.rowCount > 0) {
            // Update existing budget
            const result = await db.query(
                `UPDATE budgets 
                 SET limit_amount = $1, period = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $3 AND category_id = $4
                 RETURNING *`,
                [data.limit_amount, data.period || 'monthly', userId, data.category_id]
            );

            if (result.rows && result.rows.length > 0) {
                return result.rows[0];
            }

            // Fallback for SQLite
            const updated = await db.query(
                'SELECT id FROM budgets WHERE user_id = $1 AND category_id = $2',
                [userId, data.category_id]
            );
            return this.getBudgetById(userId, updated.rows[0].id);

        } else {
            // Create new budget
            const result = await db.query(
                `INSERT INTO budgets (user_id, category_id, limit_amount, period)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [userId, data.category_id, data.limit_amount, data.period || 'monthly']
            );

            if (result.rows && result.rows.length > 0) {
                return result.rows[0];
            }

            // Fallback for SQLite
            if (result.lastID) {
                return this.getBudgetById(userId, result.lastID);
            }

            throw new Error('Failed to create budget');
        }
    }

    /**
     * Delete a budget
     */
    async deleteBudget(userId: number, categoryId: number): Promise<void> {
        await db.query(
            'DELETE FROM budgets WHERE user_id = $1 AND category_id = $2',
            [userId, categoryId]
        );
    }

    /**
     * Get budgets that are >= 75% used (for alerts)
     */
    async getBudgetAlerts(userId: number): Promise<BudgetWithSpending[]> {
        const allBudgets = await this.getBudgets(userId);
        return allBudgets.filter(budget => budget.percentUsed >= 75);
    }

    /**
     * Calculate total spending for a category in a date range
     */
    async calculateCategorySpending(
        userId: number,
        categoryId: number,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const result = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM transactions
             WHERE user_id = $1 
               AND category_id = $2 
               AND type = 'expense'
               AND date >= $3 
               AND date <= $4`,
            [userId, categoryId, startDate.toISOString(), endDate.toISOString()]
        );

        return parseFloat(result.rows[0].total);
    }

    /**
     * Get the start date for the current period
     */
    private getCurrentPeriodStart(period: 'monthly' | 'weekly'): Date {
        const now = new Date();

        if (period === 'monthly') {
            // First day of current month
            return new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            // Start of current week (Monday)
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(now.setDate(diff));
        }
    }
}
