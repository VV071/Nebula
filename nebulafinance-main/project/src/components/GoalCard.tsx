import React from 'react';
import { Target, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Goal, calculateGoalProgress } from '../utils/goals';
import { motion } from 'framer-motion';

interface GoalCardProps {
    goal: Goal;
    transactions: any[];
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, transactions }) => {
    const { t } = useTranslation();
    const stats = calculateGoalProgress(goal, transactions);

    return (
        <motion.div
            layout
            className="glass-card p-6 border-t-4 border-t-primary-500 hover-lift stagger-item"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                        <Target className="w-6 h-6 text-primary-500" />
                        {goal.name}
                    </h3>
                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1">
                        {t('goals.target')}: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${stats.isOnTrack
                    ? 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                    {stats.isOnTrack ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {stats.isOnTrack ? t('goals.status.onTrack') : t('goals.status.behindSchedule')}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-textSecondary-light dark:text-textSecondary-dark">{t('goals.progress')}</span>
                        <span className="text-textPrimary-light dark:text-textPrimary-dark">{Math.round(stats.percentage)}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percentage}%` }}
                            className="h-full bg-primary-500 rounded-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 dark:border-gray-800">
                    <div>
                        <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1 font-semibold uppercase tracking-wider">
                            {t('goals.target')}
                        </p>
                        <p className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono">
                            ₹{goal.targetAmount.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1 font-semibold uppercase tracking-wider">
                            {t('goals.saved')}
                        </p>
                        <p className="text-lg font-bold text-secondary-600 dark:text-secondary-400 font-mono">
                            ₹{goal.currentSavings.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800">
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {t('goals.aiSuggestion')}
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm text-textPrimary-light dark:text-textPrimary-dark leading-relaxed">
                            <Trans
                                i18nKey="goals.suggestion"
                                values={{ amount: Math.round(stats.requiredMonthlySavings).toLocaleString(), months: stats.monthsRemaining }}
                                components={{ bold: <span className="font-bold" /> }}
                            />
                        </p>
                        {!stats.isOnTrack && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800">
                                {t('goals.currentPace', { amount: Math.round(stats.currentPace).toLocaleString(), gap: Math.round(stats.gap).toLocaleString() })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
