import db from '../config/database';
import { Insight } from '../models/Insight';

export class InsightService {
    async getInsights(userId: number): Promise<Insight[]> {
        const result = await db.query(
            'SELECT * FROM insights WHERE user_id = $1 AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    async dismissInsight(userId: number, insightId: number): Promise<void> {
        await db.query(
            'UPDATE insights SET is_dismissed = 1 WHERE id = $1 AND user_id = $2',
            [insightId, userId]
        );
    }

    // Placeholder for AI generation logic
    async generateInsights(userId: number): Promise<void> {
        console.log(`Generating insights for user ${userId}`);

        // 1. Analyze total spending
        const result = await db.query(
            `SELECT SUM(amount) as total_expense FROM transactions 
             WHERE user_id = $1 AND type = 'expense' AND date >= date('now', 'start of month')`,
            [userId]
        );

        const totalExpense = result.rows[0]?.total_expense || 0;

        // Simple heuristic: If expense > 10000, warn
        if (totalExpense > 10000) {
            await this.createInsight(userId, {
                type: 'warning',
                title: 'High Spending Alert',
                message: `You have spent ${totalExpense} this month.`,
                suggestion: 'Consider reviewing your recent transactions.'
            });
        }

        // 2. Check for high frequency category
        // ... (can add more logic)
    }

    private async createInsight(userId: number, data: any): Promise<void> {
        await db.query(
            `INSERT INTO insights (user_id, type, title, message, suggestion, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [userId, data.type, data.title, data.message, data.suggestion]
        );
    }
}
