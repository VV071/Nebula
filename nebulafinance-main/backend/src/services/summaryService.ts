import db from '../config/database';

export interface MonthlySummary {
    month: Date;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    topCategory: string | null;
    topCategoryAmount: number;
    biggestExpense: {
        description: string;
        amount: number;
        category: string;
    } | null;
    trend: 'increased' | 'decreased' | 'stable';
    trendPercent: number;
    transactionCount: number;
}

export class SummaryService {
    /**
     * Generate monthly summary for a user
     */
    async generateMonthlySummary(userId: number, month: Date): Promise<MonthlySummary> {
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        // Get all transactions for the month
        const transactionsResult = await db.query(
            `SELECT t.*, c.name as category_name
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = $1 
               AND t.date >= $2 
               AND t.date <= $3
             ORDER BY t.amount DESC`,
            [userId, startDate.toISOString(), endDate.toISOString()]
        );

        const transactions = transactionsResult.rows;

        // Calculate income and expenses
        const income = transactions
            .filter((t: any) => t.type === 'income')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

        const expenses = transactions
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

        const savings = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        // Category breakdown
        const expensesByCategory: Record<string, number> = {};
        transactions
            .filter((t: any) => t.type === 'expense')
            .forEach((t: any) => {
                const categoryName = t.category_name || 'Unknown';
                if (!expensesByCategory[categoryName]) {
                    expensesByCategory[categoryName] = 0;
                }
                expensesByCategory[categoryName] += parseFloat(t.amount);
            });

        const sortedCategories = Object.entries(expensesByCategory)
            .sort(([, a], [, b]) => b - a);

        const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : null;
        const topCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

        // Biggest expense
        const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
        const biggestExpense = expenseTransactions.length > 0
            ? {
                description: expenseTransactions[0].description || 'No description',
                amount: parseFloat(expenseTransactions[0].amount),
                category: expenseTransactions[0].category_name || 'Unknown'
            }
            : null;

        // Previous month comparison
        const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
        const prevSummary = await this.getMonthlySummaryData(userId, prevMonth);

        let trend: 'increased' | 'decreased' | 'stable' = 'stable';
        let trendPercent = 0;

        if (prevSummary && prevSummary.expenses > 0) {
            const change = expenses - prevSummary.expenses;
            trendPercent = (change / prevSummary.expenses) * 100;
            trend = trendPercent > 5 ? 'increased' : trendPercent < -5 ? 'decreased' : 'stable';
        }

        return {
            month: startDate,
            income,
            expenses,
            savings,
            savingsRate,
            topCategory,
            topCategoryAmount,
            biggestExpense,
            trend,
            trendPercent: Math.abs(trendPercent),
            transactionCount: transactions.length
        };
    }

    /**
     * Get basic summary data for a month (used for comparisons)
     */
    private async getMonthlySummaryData(userId: number, month: Date): Promise<{ income: number; expenses: number } | null> {
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const result = await db.query(
            `SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
             FROM transactions
             WHERE user_id = $1 
               AND date >= $2 
               AND date <= $3`,
            [userId, startDate.toISOString(), endDate.toISOString()]
        );

        if (result.rowCount === 0) return null;

        return {
            income: parseFloat(result.rows[0].income) || 0,
            expenses: parseFloat(result.rows[0].expenses) || 0
        };
    }
}
