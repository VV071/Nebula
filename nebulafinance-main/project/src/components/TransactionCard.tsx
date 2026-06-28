import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Define types locally if not exported from context, or use any for flexibility with context types
interface TransactionCardProps {
    transaction: any; // Using any to match the context type structure loosely for now, or could import
    account?: any;
    category?: any;
    onEdit: (transaction: any) => void;
    onDelete: (id: string) => void;
    formatCurrency: (amount: number) => string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
    account,
    category,
    onEdit,
    onDelete,
    formatCurrency
}) => {
    const { t } = useTranslation();

    const getCategoryIcon = (iconName: string, color: string) => {
        const IconComponent = (LucideIcons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent className="w-6 h-6" style={{ color }} />;
    };

    const balanceChange = (transaction.balance_after || 0) - (transaction.balance_before || 0);
    const showBalanceImpact = transaction.balance_before !== undefined && transaction.balance_after !== undefined;

    return (
        <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-0 stagger-item">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                    {category && getCategoryIcon(category.icon, category.color)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-textPrimary-light dark:text-textPrimary-dark truncate">
                                {transaction.description || category?.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-textSecondary-light dark:text-textSecondary-dark">
                                <span>{account?.name}</span>
                                <span>•</span>
                                <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div
                                className={`text-xl font-bold font-mono ${transaction.type === 'income'
                                        ? 'text-secondary-600 dark:text-secondary-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}
                            >
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(Number(transaction.amount))}
                            </div>
                        </div>
                    </div>

                    {/* Balance Impact Section */}
                    {(showBalanceImpact || transaction.budgetImpact) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">

                            {showBalanceImpact && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
                                    <span>Balance: {formatCurrency(transaction.balance_before)} → {formatCurrency(transaction.balance_after)}</span>
                                    <span className={`font-mono font-medium ${balanceChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                        ({balanceChange >= 0 ? '+' : ''}{formatCurrency(balanceChange)})
                                    </span>
                                </div>
                            )}

                            {transaction.budgetImpact && (
                                <div className="mt-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span>
                                        {transaction.budgetImpact.category} budget remaining: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(transaction.budgetImpact.remaining)}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(transaction)}
                        className="p-2 rounded-button hover:bg-slate-200 dark:hover:bg-slate-700 text-textSecondary-light dark:text-textSecondary-dark hover:text-primary-600 dark:hover:text-primary-400"
                        title={t('common.edit')}
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(transaction.id)}
                        className="p-2 rounded-button hover:bg-slate-200 dark:hover:bg-slate-700 text-textSecondary-light dark:text-textSecondary-dark hover:text-red-600 dark:hover:text-red-400"
                        title={t('common.delete')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
