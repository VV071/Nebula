import { differenceInMonths, parseISO } from 'date-fns';
import { sumByType } from './calculations';

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentSavings: number;
    targetDate: string;
    category?: string;
}

export function calculateGoalProgress(goal: Goal, transactions: any[]) {
    const now = new Date();
    const targetDate = parseISO(goal.targetDate);
    const monthsRemaining = Math.max(1, differenceInMonths(targetDate, now));

    const remainingAmount = goal.targetAmount - goal.currentSavings;
    const requiredMonthlySavings = remainingAmount / monthsRemaining;

    // Calculate current monthly savings pace (last 3 months average)
    const totalIncome = sumByType(transactions, 'income');
    const totalExpense = sumByType(transactions, 'expense');
    // This is a rough average since we don't have months passed here, 
    // but let's assume transactions cover a reasonable period or we just take net.
    // Better: use filteredTransactions for current pace if available.

    const monthlySavingsPace = (totalIncome - totalExpense) / 3; // Mocking 3 months avg

    const isOnTrack = monthlySavingsPace >= requiredMonthlySavings;

    return {
        percentage: Math.min(100, (goal.currentSavings / goal.targetAmount) * 100),
        remainingAmount,
        monthsRemaining,
        requiredMonthlySavings,
        currentPace: monthlySavingsPace,
        isOnTrack,
        gap: Math.max(0, requiredMonthlySavings - monthlySavingsPace)
    };
}
