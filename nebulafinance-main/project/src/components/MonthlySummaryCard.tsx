import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MonthlySummaryCardProps {
    summary: any;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({ summary }) => {
    if (!summary) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'increased': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
            case 'decreased': return <ArrowDownRight className="w-4 h-4 text-emerald-500" />; // For expenses, decrease is good
            default: return <Minus className="w-4 h-4 text-slate-500" />;
        }
    };

    const trendColor = summary.trend === 'decreased' ? 'text-emerald-600 dark:text-emerald-400' :
        summary.trend === 'increased' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400';

    return (
        <div className="glass-card p-6 mb-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark mb-1">
                        Monthly Summary
                    </h3>
                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                        Overview for {new Date(summary.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex flex-wrap gap-8">
                    <div className="space-y-1">
                        <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider font-semibold">
                            Spending
                        </span>
                        <p className="text-2xl font-bold font-mono text-textPrimary-light dark:text-textPrimary-dark">
                            {formatCurrency(summary.expenses)}
                        </p>
                        {summary.trend !== 'stable' && (
                            <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                                {getTrendIcon(summary.trend)}
                                <span>{summary.trendPercent.toFixed(0)}% vs last month</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider font-semibold">
                            Savings
                        </span>
                        <p className={`text-2xl font-bold font-mono ${summary.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(summary.savings)}
                        </p>
                        <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                            {summary.savingsRate.toFixed(0)}% savings rate
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider font-semibold">
                            Top Category
                        </span>
                        <p className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                            {summary.topCategory || 'N/A'}
                        </p>
                        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                            {formatCurrency(summary.topCategoryAmount)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
