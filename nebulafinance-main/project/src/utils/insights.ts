import { startOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { sumByType } from './calculations';

export interface InsightAction {
    label: string;
    onClick: () => void;
}

export interface SmartInsight {
    id: string;
    type: 'spending_pace' | 'savings_forecast' | 'category_pattern' | 'top_spending';
    // ... rest of interface
    title: string;
    message: string;
    details?: string;
    suggestion?: string;
    icon?: string;
    actions?: InsightAction[];
    dismissible: boolean;
    priority: number;
}

// Helper to get logical "now" from data if not provided
const getReferenceDate = (transactions: any[]) => {
    if (transactions.length === 0) return new Date();
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
};

export function detectSpendingPaceAlert(transactions: any[], referenceDate?: Date): SmartInsight | null {
    const now = referenceDate || getReferenceDate(transactions);
    const monthStart = startOfMonth(now);
    // monthEnd removed as it was unused

    // Days elapsed in the logical "current" month
    const daysInMonth = 30; // Approximation
    const currentDay = now.getDate();

    const currentMonthTransactions = transactions.filter(t =>
        isWithinInterval(parseISO(t.date), { start: monthStart, end: now })
    );

    const currentMonthSpending = sumByType(currentMonthTransactions, 'expense');

    // Calculate average spending from preceding 3 months relative to data
    const threeMonthsAgo = subMonths(monthStart, 3);
    const historicTransactions = transactions.filter(t =>
        isWithinInterval(parseISO(t.date), { start: threeMonthsAgo, end: monthStart })
    );
    const totalHistoricSpending = sumByType(historicTransactions, 'expense');
    const avgMonthlySpending = totalHistoricSpending / 3;

    if (currentDay > 0 && avgMonthlySpending > 0) {
        const dailyRate = currentMonthSpending / currentDay;
        const projectedSpending = dailyRate * daysInMonth;

        if (projectedSpending > avgMonthlySpending * 1.2) {
            return {
                id: `spending_pace_${now.getMonth()}_${now.getFullYear()}`,
                type: 'spending_pace',
                title: 'Spending Alert',
                message: `You've spent ₹${currentMonthSpending.toLocaleString('en-IN')} in ${currentDay} days.`,
                details: `At this pace, you'll spend ₹${Math.round(projectedSpending).toLocaleString('en-IN')} this month (vs your ₹${Math.round(avgMonthlySpending).toLocaleString('en-IN')} average).`,
                suggestion: 'Consider reviewing discretionary spending.',
                dismissible: true,
                priority: 1
            };
        }
    }

    return null;
}

export function detectSavingsForecast(transactions: any[], referenceDate?: Date): SmartInsight | null {
    const now = referenceDate || getReferenceDate(transactions);
    const threeMonthsAgo = subMonths(now, 3);
    const historicTransactions = transactions.filter(t =>
        isWithinInterval(parseISO(t.date), { start: threeMonthsAgo, end: now })
    );

    const totalIncome = sumByType(historicTransactions, 'income');
    const totalExpense = sumByType(historicTransactions, 'expense');

    const avgMonthlyIncome = totalIncome / 3;
    const avgMonthlyExpenses = totalExpense / 3;
    const monthlySavings = avgMonthlyIncome - avgMonthlyExpenses;

    if (monthlySavings > 0) {
        return {
            id: 'savings_projection',
            type: 'savings_forecast',
            title: 'Savings Projection',
            message: `Based on your recent history, you're saving about ₹${Math.round(monthlySavings).toLocaleString('en-IN')}/month.`,
            details: `If this continues, you'll have saved ₹${Math.round(monthlySavings).toLocaleString('en-IN')} by next month.`,
            suggestion: 'Ready to set a new savings goal?',
            dismissible: false,
            priority: 2
        };
    }

    return null;
}

export function detectWeekendPattern(transactions: any[], referenceDate?: Date): SmartInsight | null {
    const now = referenceDate || getReferenceDate(transactions);
    const periodStart = subMonths(now, 1);
    const recentTransactions = transactions.filter(t =>
        t.type === 'expense' && parseISO(t.date) >= periodStart && parseISO(t.date) <= now
    );

    if (recentTransactions.length < 10) return null;

    const weekendSpending: number[] = [];
    const weekdaySpending: number[] = [];

    recentTransactions.forEach(t => {
        const date = parseISO(t.date);
        const day = date.getDay(); // 0 is Sunday, 6 is Saturday
        if (day === 0 || day === 6) {
            weekendSpending.push(Number(t.amount));
        } else {
            weekdaySpending.push(Number(t.amount));
        }
    });

    const avgWeekend = weekendSpending.length > 0 ? weekendSpending.reduce((a, b) => a + b, 0) / weekendSpending.length : 0;
    const avgWeekday = weekdaySpending.length > 0 ? weekdaySpending.reduce((a, b) => a + b, 0) / weekdaySpending.length : 0;

    if (avgWeekend > avgWeekday * 1.5 && avgWeekend > 500) {
        return {
            id: 'weekend_pattern',
            type: 'category_pattern',
            title: 'Spending Pattern',
            message: `Your spending is significantly higher on weekends.`,
            details: `Avg weekend: ₹${Math.round(avgWeekend).toLocaleString('en-IN')}/day vs Avg weekday: ₹${Math.round(avgWeekday).toLocaleString('en-IN')}/day.`,
            suggestion: 'Try setting a "Weekend Budget" to save more.',
            dismissible: true,
            priority: 3
        };
    }

    return null;
}

export function detectTopCategoryAlert(transactions: any[], categories: any[], referenceDate?: Date): SmartInsight | null {
    const now = referenceDate || getReferenceDate(transactions);
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    const currentMonthTransactions = transactions.filter(t =>
        t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: currentMonthStart, end: now })
    );

    const lastMonthTransactions = transactions.filter(t =>
        t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: lastMonthStart, end: currentMonthStart })
    );

    if (currentMonthTransactions.length === 0) return null;

    const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Group current month by category
    const categoryTotals: { [key: string]: number } = {};
    currentMonthTransactions.forEach(t => {
        const catId = t.category_id || t.category;
        categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.amount);
    });

    // Find top category
    let topCategoryId = '';
    let topAmount = 0;
    Object.entries(categoryTotals).forEach(([id, amount]) => {
        if (amount > topAmount) {
            topAmount = amount;
            topCategoryId = id;
        }
    });

    if (!topCategoryId) return null;

    const category = categories.find(c => String(c.id) === String(topCategoryId));
    const categoryName = category?.name || 'Unknown';
    const percentageOfTotal = Math.round((topAmount / currentMonthTotal) * 100);

    // Get last month's spending for same category
    const lastMonthCategoryAmount = lastMonthTransactions
        .filter(t => String(t.category_id || t.category) === String(topCategoryId))
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastMonthPercentage = lastMonthTotal > 0
        ? Math.round((lastMonthCategoryAmount / lastMonthTotal) * 100)
        : 0;

    if (percentageOfTotal > 30) {
        return {
            id: `top_category_${topCategoryId}_${now.getMonth()}`,
            type: 'top_spending',
            title: 'Category Alert',
            message: `"${categoryName}" is your highest spending category recently.`,
            details: `₹${topAmount.toLocaleString('en-IN')} - ${percentageOfTotal}% of total expenses. ${lastMonthTotal > 0 ? `Previously it was ${lastMonthPercentage}%.` : ''}`,
            suggestion: `Set a "${categoryName}" budget to manage this better.`,
            dismissible: true,
            priority: 4
        };
    }

    return null;
}

export function generateInsights(transactions: any[], dismissedIds: string[], categories: any[]): SmartInsight[] {
    const insights: SmartInsight[] = [];
    const reference = getReferenceDate(transactions);

    const pace = detectSpendingPaceAlert(transactions, reference);
    if (pace && !dismissedIds.includes(pace.id)) insights.push(pace);

    const forecast = detectSavingsForecast(transactions, reference);
    if (forecast && !dismissedIds.includes(forecast.id)) insights.push(forecast);

    const weekend = detectWeekendPattern(transactions, reference);
    if (weekend && !dismissedIds.includes(weekend.id)) insights.push(weekend);

    const topCat = detectTopCategoryAlert(transactions, categories, reference);
    if (topCat && !dismissedIds.includes(topCat.id)) insights.push(topCat);

    return insights.sort((a, b) => a.priority - b.priority);
}
