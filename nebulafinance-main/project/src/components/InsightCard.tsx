import React from 'react';
import { X, Lightbulb, AlertTriangle, BarChart3, PiggyBank } from 'lucide-react';
import { SmartInsight } from '../utils/insights';
import { motion } from 'framer-motion';

interface InsightCardProps {
    insight: SmartInsight;
    onDismiss?: (id: string) => void;
}

const getIcon = (type: SmartInsight['type']) => {
    switch (type) {
        case 'spending_pace': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
        case 'savings_forecast': return <PiggyBank className="w-6 h-6 text-secondary-500" />;
        case 'category_pattern': return <BarChart3 className="w-6 h-6 text-primary-500" />;
        default: return <Lightbulb className="w-6 h-6 text-primary-500" />;
    }
};

const getBgColor = (type: SmartInsight['type']) => {
    switch (type) {
        case 'spending_pace': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800';
        case 'savings_forecast': return 'bg-secondary-50 dark:bg-secondary-900/10 border-secondary-200 dark:border-secondary-800';
        case 'category_pattern': return 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800';
        default: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative p-6 rounded-2xl border ${getBgColor(insight.type)} shadow-sm transition-all hover:shadow-md`}
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                    {getIcon(insight.type)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark">
                            {insight.title}
                        </h4>
                        {insight.dismissible && onDismiss && (
                            <button
                                onClick={() => onDismiss(insight.id)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                                aria-label="Dismiss"
                            >
                                <X className="w-4 h-4 text-textSecondary-light dark:text-textSecondary-dark" />
                            </button>
                        )}
                    </div>

                    <p className="text-textPrimary-light dark:text-textPrimary-dark font-medium mb-2">
                        {insight.message}
                    </p>

                    {insight.details && (
                        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-4 leading-relaxed">
                            {insight.details}
                        </p>
                    )}

                    {insight.suggestion && (
                        <div className="flex items-center gap-2 mt-2 py-2 px-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20">
                            <Lightbulb className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                                {insight.suggestion}
                            </span>
                        </div>
                    )}

                    {insight.actions && insight.actions.length > 0 && (
                        <div className="flex gap-3 mt-4">
                            {insight.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className="px-4 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-900 text-textPrimary-light dark:text-textPrimary-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
